import { Request } from 'express';

export interface ITokenService {
    login(request: Request): Promise<any>,
    validateToken(request: Request): Promise<void>,
    logout(req: Request): Promise<object> 
}