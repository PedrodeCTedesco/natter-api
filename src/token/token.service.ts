import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { Instant, ChronoUnit } from '@js-joda/core';
import { TokenStore } from '../interfaces/toke.store.interface';
import { Token } from './token';
import { AUDIT_LOGGING_SERVICE } from '../audit_logging/constants/audit.logging.method.identifiers';
import { TOKEN_STORE } from './constants/token.store.constants';
import { AUDIT_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.audit.service';
import { IAuditService } from 'src/interfaces/audit.service.interface';
import { USER_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.user.service';
import { IUserService } from 'src/interfaces/user.service.interface';

@Injectable()
export class TokenService {
    constructor(
        @Inject(TOKEN_STORE) private readonly tokenStore: TokenStore,
        @Inject(AUDIT_SERVICE_TOKEN) private readonly auditService: IAuditService,
        @Inject(USER_SERVICE_TOKEN) private readonly userService: IUserService
    ) {}

    async login(request: Request): Promise<{ token: string }> {
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

            return { token: tokenId };
            
        } catch (error) {
            await this.auditService[AUDIT_LOGGING_SERVICE.LOG_REQUEST_END]({
                auditId,
                method: request.method,
                path: request.path,
                statusCode: 500,
                userId: subject
            });

            throw new HttpException({
                message: 'Failed to create session token',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async logout(request: Request): Promise<object> {
        let tokenId = request.headers['authorization'];

        // 1. Verifica se tem Authorization e se começa com "Bearer "
        if (!tokenId?.startsWith('Bearer ')) {
            throw new Error('Missing or invalid Authorization header');
        }

        // 2. Remove o prefixo "Bearer " e pega apenas o token
        tokenId = tokenId.substring(7).trim();

        // Revoga o token usando o token service
        await this.tokenStore.revoke(request, tokenId);

        return {};
    }

    async validateToken(request: Request, response?: any): Promise<void> {
        let tokenId = request.headers['authorization'];

        // 1. Verifica se tem Authorization e se começa com "Bearer "
        if (!tokenId?.startsWith('Bearer ')) {
            throw new Error('Missing or invalid Authorization header');
        }

        // 2. Remove o prefixo "Bearer " e pega apenas o token
        tokenId = tokenId.substring(7).trim();

        // 3. Lê o token no store
        const token = await this.tokenStore.read(request, tokenId);

        if (token && Instant.now().isBefore(token.expiry)) {
            // 4. Valida usuário associado ao token
            const user = await this.userService.validateBasicAuth(token.username);

            if (user) {
            const userObj = {
                ...user,
                id: user.user_id,
                username: user.user_id,
            };
            request['user'] = userObj;
            } else {
            console.log('❌ VALIDATE TOKEN - No user found for username:', token.username);
            }

            // 5. Injeta atributos do token na request
            token.attributes.forEach((value, key) => {
            request[key] = value;
            });
        } else {
            // 6. Expirado ou inválido → responde com WWW-Authenticate (caso tenha response)
            if (response) {
            response.setHeader(
                'WWW-Authenticate',
                'Bearer error="invalid_token", error_description="Expired or invalid"'
            );
            }
            throw new Error('Invalid or expired Bearer token');
        }
    }

    async deleteExpiredTokens(): Promise<void> {
        try {
            return await this.tokenStore.deleteExpiredTokens();
        } catch (err) {
            console.error('Erro ao deletar tokens expirados: ', err.message);
        }
    } 
}    