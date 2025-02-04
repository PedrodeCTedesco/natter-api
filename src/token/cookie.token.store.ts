import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Token } from './token';
import { TokenStore } from '../interfaces/toke.store.interface';
import { Instant } from '@js-joda/core';

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
        if (!request.session) {
            throw new Error('Session middleware not initialized');
        }

        const sessionToken = {
            expiry: token.expiry.toString(),
            username: token.username,
            attributes: token.attributes
        };

        request.session.token = sessionToken;
        return request.sessionID;
    }

    async read(request: Request, tokenId: string): Promise<Token | undefined> {
        if (!request.session?.token || request.sessionID !== tokenId) {
            return undefined;
        }

        const { expiry, username, attributes } = request.session.token;
        // Converter string para Instant
        const expiryInstant = Instant.parse(expiry);
        const token = new Token(expiryInstant, username);
        
        // Copiar os atributos para o novo token
        attributes.forEach((value: any, key: string) => {
            token.attributes.set(key, value);
        });

        return token;
    }
}