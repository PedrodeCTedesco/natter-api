/* import { Inject, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { TOKEN_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.interface.token.service';
import { ITokenService } from 'src/interfaces/token.service.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(TOKEN_SERVICE_TOKEN)
    private readonly tokenService: ITokenService
  ) {}

  static getAuthenticatedUser(req: Request): any {
    return req['user'];
  }

  async login(req: Request, res: Response) {
    return this.tokenService.login(req, res);
  }
}
 */
import { Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { TOKEN_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.interface.token.service';
import { ITokenService } from 'src/interfaces/token.service.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(TOKEN_SERVICE_TOKEN)
    private readonly tokenService: ITokenService
  ) {}

  static getAuthenticatedUser(req: Request): any {
    return req['user'];
  }

  /**
   * Delegar login para o TokenService.
   * Retorna o resultado para o controller gerenciar a resposta.
   */
  async login(req: Request) {
    return this.tokenService.login(req);
  }
}