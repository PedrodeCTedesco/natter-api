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
        const auditId = await this.auditService[AUDIT_LOGGING_SERVICE.GENERATE_AUDIT_ID]();

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
            await this.auditService[AUDIT_LOGGING_SERVICE.UPDATE_LOG]({
                auditId,
                userId: subject
            });

            const tokenId = await this.tokenStore.create(request, token);

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

    async validateToken(request: Request): Promise<void> {
        const token = await this.tokenStore.read(request, request.sessionID);
        
        if (token && Instant.now().isBefore(token.expiry)) {
            request['user'] = token.username;
            token.attributes.forEach((value, key) => {
                request[key] = value;
            });
        }
    }
}