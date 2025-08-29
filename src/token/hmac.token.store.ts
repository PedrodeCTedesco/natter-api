import { Injectable, Inject } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { Token } from './token';
import { TokenStore } from 'src/interfaces/toke.store.interface';
import { JsonTokenStore } from './jwt.token.store';

@Injectable()
export class HmacTokenStore implements TokenStore {
  private readonly secret: Buffer;

  constructor(
    private readonly delegate: JsonTokenStore, // TokenStore real (ex: JsonTokenStore)
    @Inject('HMAC_SECRET') secretKey: string, // Chave secreta injetada via módulo
  ) {
    this.secret = Buffer.from(secretKey, 'utf-8');
  }

  async create(request: Request, token: Token): Promise<string> {
    // Gera o token base no delegate (ex: JsonTokenStore)
    const tokenId: string = await this.delegate.create(request, token);

    // Calcula o HMAC do tokenId
    const tag = this.hmac(tokenId);

    // Concatena o tokenId original com o HMAC codificado em Base64URL
    return `${tokenId}.${this.base64UrlEncode(tag)}`;
  }

  async read(request: Request, tokenWithTag: string): Promise<Token | null> {
    const index = tokenWithTag.lastIndexOf('.');
    if (index === -1) return null;

    const tokenId = tokenWithTag.substring(0, index);
    const providedTagStr = tokenWithTag.substring(index + 1);

    // Decodifica a tag fornecida (Base64URL → bytes)
    const providedTag = this.base64UrlDecode(providedTagStr);

    // Recalcula o HMAC do tokenId
    const expectedTag = this.hmac(tokenId);

    // Compara em tempo constante
    if (!crypto.timingSafeEqual(providedTag, expectedTag)) {
      return null;
    }

    // Se HMAC confere → consulta o TokenStore real
    return this.delegate.read(request, tokenId);
  }

  async revoke(request: Request, tokenWithTag: string): Promise<void> {
    const index = tokenWithTag.lastIndexOf('.');
    if (index === -1) return;

    const tokenId = tokenWithTag.substring(0, index);
    return this.delegate.revoke(request, tokenId);
  }

  async deleteExpiredTokens(): Promise<void> {
    return; // opcional
  }

  private hmac(tokenId: string): Buffer {
    return crypto.createHmac('sha256', this.secret)
      .update(tokenId, 'utf-8')
      .digest();
  }

  private base64UrlEncode(buffer: Buffer): string {
    return buffer.toString('base64')
      .replace(/\+/g, '-') // + → -
      .replace(/\//g, '_') // / → _
      .replace(/=+$/, ''); // remove padding
  }

  private base64UrlDecode(str: string): Buffer {
    let padded = str;
    const remainder = padded.length % 4;
    if (remainder) {
      padded += '='.repeat(4 - remainder);
    }

    const base64 = padded
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    return Buffer.from(base64, 'base64');
  }
}
