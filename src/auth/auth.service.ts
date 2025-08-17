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

  async login(req: Request) {
    return this.tokenService.login(req);
  }
}