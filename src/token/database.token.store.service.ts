import { Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Instant } from '@js-joda/core';
import { promisify } from 'node:util';
import * as sqlite3 from 'sqlite3';
import * as crypto from 'crypto';
import { randomBytes } from 'crypto';
import { Token } from './token';
import { DATABASE_TOKEN } from 'src/interfaces/interfaces.tokens/token.database';

@Injectable()
export class DatabaseTokenStore {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: sqlite3.Database,
  ) {}

  async create(request: Request, token: Token): Promise<string> {
    try {
      // gera um identificador secreto randômico
      const rawId = this.randomId();

      // hash do identificador
      const hash = crypto.createHash('sha256').update(rawId).digest();

      // converte hash para Base64 URL-safe (esse será o tokenId exposto)
      const tokenId = this.base64UrlEncode(hash);

      const attrs = JSON.stringify(token.attributes);
      const runAsync = promisify(this.db.run.bind(this.db));

      // armazena apenas o hash binário (não o tokenId em claro)
      await runAsync(
        `INSERT INTO tokens (token_id, user_id, expiry, attributes) VALUES (?, ?, ?, ?)`,
        hash, // armazenado como BLOB
        token.username,
        token.expiry.toString(),
        attrs,
      );

      return tokenId;
    } catch (err) {
      console.error('Erro ao salvar token na base de dados: ', err.message);
      throw err;
    }
  }

  async read(request: Request, tokenId: string): Promise<Token | null> {
    const getAsync = promisify(this.db.get.bind(this.db));

    // decodifica o token recebido (string → Buffer hash)
    const providedBuffer = this.base64UrlDecode(tokenId);

    const row:
      | { user_id: string; expiry: string; attributes: string }
      | undefined = await getAsync(
      `SELECT user_id, expiry, attributes 
         FROM tokens 
        WHERE token_id = ?`,
      providedBuffer,
    );

    if (!row) return null;

    const expiryInstant = Instant.parse(new Date(row.expiry).toISOString());
    const token = new Token(expiryInstant, row.user_id);

    const attrs = JSON.parse(row.attributes || '{}');
    for (const key of Object.keys(attrs)) {
      token.attributes.set(key, attrs[key]);
    }

    return token;
  }

  async revoke(request: Request, tokenId: string): Promise<void> {
    const runAsync = promisify(this.db.run.bind(this.db));

    // decodifica o token recebido
    const providedBuffer = this.base64UrlDecode(tokenId);

    await runAsync(`DELETE FROM tokens WHERE token_id = ?`, providedBuffer);
  }

  async deleteExpiredTokens(): Promise<void> {
    const runAsync = promisify(this.db.run.bind(this.db));
    await runAsync(`DELETE FROM tokens WHERE expiry < current_timestamp`);
  }

  private randomId(): string {
    const bytes = randomBytes(32);
    return bytes.toString('hex');
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
