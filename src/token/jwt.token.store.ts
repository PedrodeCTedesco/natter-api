import { Injectable } from '@nestjs/common';
import { Instant } from '@js-joda/core';
import { Token } from './token';
import { Request } from 'express';
import { TokenStore } from 'src/interfaces/toke.store.interface';

@Injectable()
export class JsonTokenStore implements TokenStore {
  async create(request: any, token: Token): Promise<string> {
    const json: any = {
      sub: token.username,
      exp: token.expiry,
      attrs: token.attributes,
    };

    const jsonStr = JSON.stringify(json);
    const jsonBytes = Buffer.from(jsonStr, 'utf8');
    return this.base64UrlEncode(jsonBytes);
  }

  async read(request: any, tokenId: string): Promise<Token | undefined> {
  try {
    // Decodifica e garante que seja string UTF-8
    const decoded = this.base64UrlDecode(tokenId);
    const json = JSON.parse(decoded.toString('utf8'));

    // Usa Instant em vez de Date
    const expiry = Instant.ofEpochSecond(json.exp);
    const username = json.sub;
    const attrs = json.attrs;

    const token = new Token(expiry, username);

    if (attrs && typeof attrs === 'object') {
      for (const key of Object.keys(attrs)) {
        token.attributes.set(key, String(attrs[key]));
      }
    }

    return token;
  } catch (e) {
    console.log('erro ao ler token: ', e.message)
    return undefined;
  }
}

  async revoke(request: Request, tokenId: string): Promise<void> {
    return;
  }

  async deleteExpiredTokens(): Promise<void> {
    return;
  }

  private base64UrlEncode(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private base64UrlDecode(str: string): Buffer {
    let padded = str;
    const remainder = padded.length % 4;
    if (remainder) {
      padded += '='.repeat(4 - remainder);
    }
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64');
  }
}
