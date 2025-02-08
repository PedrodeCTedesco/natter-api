import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Token } from './token';
import { TokenStore } from '../interfaces/toke.store.interface';
import { Instant } from '@js-joda/core';
import { inspect, promisify } from 'node:util';

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

        if (request.session.token) {
            const regenerateSession = promisify(request.session.regenerate.bind(request.session));
            await regenerateSession();
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
        if (!request.session?.token || request.sessionID !== tokenId) return undefined;
        inspect(request.session?.token, { depth: null, colors: true })

        const { expiry, username, attributes } = request.session.token;
        const expiryInstant = Instant.parse(expiry);
        const token = new Token(expiryInstant, username);
        
        attributes.forEach((value: any, key: string) => {
            token.attributes.set(key, value);
        });

        return token;
    }
}