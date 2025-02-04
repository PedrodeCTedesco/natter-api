import { Inject, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { Instant, ChronoUnit } from '@js-joda/core';
import { TokenStore } from '../interfaces/toke.store.interface';
import { Token } from './token';
import { AuditService } from '../audit_logging/audit_logging.service';
import { AUDIT_LOGGING_SERVICE } from '../audit_logging/constants/audit.logging.method.identifiers';
import { TOKEN_STORE } from './constants/token.store.constants';

@Injectable()
export class TokenService {
    constructor(
        @Inject(TOKEN_STORE) private readonly tokenStore: TokenStore,
        private readonly auditService: AuditService
    ) {}

    async login(request: Request, response: Response): Promise<any> {
        // Gera um ID de auditoria
        const auditId = await this.auditService[AUDIT_LOGGING_SERVICE.GENERATE_AUDIT_ID]();

        // Registra o início da requisição
        await this.auditService[AUDIT_LOGGING_SERVICE.LOG_REQUEST_START]({
            auditId,
            method: request.method,
            path: request.path,
            user: request['user']?.username
        });

        const subject = request['user']?.username;
        const expiry = Instant.now().plus(10, ChronoUnit.MINUTES);
        const token = new Token(expiry, subject);

        try {
            // Atualiza o log com informações do usuário
            await this.auditService[AUDIT_LOGGING_SERVICE.UPDATE_LOG]({
                auditId,
                userId: subject
            });

            const tokenId = await this.tokenStore.create(request, token);

            // Finaliza o log da requisição
            await this.auditService[AUDIT_LOGGING_SERVICE.LOG_REQUEST_END]({
                auditId,
                method: request.method,
                path: request.path,
                statusCode: 201,
                userId: subject
            });

            response.status(201).json({
                token: tokenId
            });
        } catch (error) {
            // Finaliza o log da requisição em caso de erro
            await this.auditService[AUDIT_LOGGING_SERVICE.LOG_REQUEST_END]({
                auditId,
                method: request.method,
                path: request.path,
                statusCode: 500,
                userId: subject
            });

            response.status(500).json({
                message: 'Failed to create session token',
                error: error.message
            });
        }
    }
}