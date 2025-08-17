import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Token } from './token';
import { TokenStore } from '../interfaces/toke.store.interface';
import { Instant } from '@js-joda/core';
import { promisify } from 'node:util';
import * as crypto from 'crypto';

declare module 'express-session' {
    interface SessionData {
        token?: {
            expiry: string;
            username: string;
            attributes: Map<string, any>;
        };
    }
}

@Injectable()
export class CookieTokenStore implements TokenStore {

    async create(request: Request, token: Token): Promise<string> {
        if (!request.session) throw new Error('Session middleware not initialized');

        // Regenera sessão se já existir
        if (request.session.token) {
            const regenerateSession = promisify(request.session.regenerate.bind(request.session));
            await regenerateSession();
        }

        // Armazena os dados do token na sessão
        const sessionToken = {
            expiry: token.expiry.toString(),
            username: token.username,
            attributes: token.attributes
        };
        request.session.token = sessionToken;

        // Calcula SHA-256 do sessionID
        const hash = crypto.createHash('sha256')
            .update(request.sessionID)
            .digest();

        // Converte para Base64 URL-safe
        const tokenId = this.base64UrlEncode(hash);

        return tokenId;
    }

    async read(request: Request, tokenId: string): Promise<Token | undefined> {
                console.log('dados: ', {
            request: request.sessionID,
            tokenId,
            token: request.session?.token
        })
        
        if (!request.session?.token) return undefined;

        // Calcula SHA-256 do sessionID
        const hash = crypto.createHash('sha256')
            .update(request.sessionID)
            .digest();
        
        const computedTokenId = this.base64UrlEncode(hash);

        // Compara usando tempo constante
        if (!this.constantTimeEqual(computedTokenId, tokenId)) return undefined;

        const { expiry, username, attributes } = request.session.token;

        const expiryInstant = Instant.parse(expiry);
        const token = new Token(expiryInstant, username);
        
        if (typeof attributes === 'object' && attributes !== null) {
            for (const key in attributes) {
                if (Object.hasOwn(attributes, key)) {
                    token.attributes.set(key, attributes[key]);
                }
            }
        }

        return token;
    }

    private base64UrlEncode(buffer: Buffer): string {
        return buffer.toString('base64')
            .replace(/\+/g, '-')  // + → -
            .replace(/\//g, '_')  // / → _
            .replace(/=+$/, '');  // remove padding
    }    

    private constantTimeEqual(a: string, b: string): boolean {
        const bufA = Buffer.from(a, 'utf-8');
        const bufB = Buffer.from(b, 'utf-8');

        // Se os tamanhos são diferentes, retorna falso imediatamente
        if (bufA.length !== bufB.length) return false;

        // crypto.timingSafeEqual faz comparação em tempo constante
        return crypto.timingSafeEqual(bufA, bufB);
    }
}