import { Inject, Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
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

    async logout(req: Request): Promise<object> {
        // Obtém o token ID do header X-CSRF-Token
        const tokenId = req.headers['x-csrf-token'] as string;
        
        if (!tokenId) throw new BadRequestException('missing token header');

        // Revoga o token usando o token service
        await this.tokenStore.revoke(req, tokenId);

        return {};
    }

    async validateToken(request: Request): Promise<void> {
        const csrfToken = request.headers['x-csrf-token'] as string;

        if (!csrfToken) {
            throw new Error('Missing CSRF token');
        }

        const token = await this.tokenStore.read(request, csrfToken);

        if (token && Instant.now().isBefore(token.expiry)) {
            const user = await this.userService.validateBasicAuth(token.username);
            
            if (user) {
                const userObj = {
                    ...user,
                    id: user.user_id,
                    username: user.user_id
                };
                request['user'] = userObj;
            } else {
                console.log('❌ VALIDATE TOKEN - No user found for username:', token.username);
            }
            
            token.attributes.forEach((value, key) => {
                request[key] = value;
            });
        } else {
            throw new Error('Invalid or expired CSRF token');
        }
    }
}    