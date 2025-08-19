import { Token } from "../token/token";
import { Request } from 'express';

export interface TokenStore {
    create(request: any, token: Token): Promise<string>;
    read(request: any, tokenId: string): Promise<Token | undefined>;
    revoke(request: Request, tokenId: string): Promise<void>
}