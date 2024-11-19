import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthService {

  static getAuthenticatedUser(req: Request): any {
    return req['user'];
  }
}
