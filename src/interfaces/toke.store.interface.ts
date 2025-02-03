import { Token } from "../token/token";

export interface TokenStore {
    create(request: any, token: Token): Promise<string>;
    read(request: any, tokenId: string): Promise<Token | undefined>;
}