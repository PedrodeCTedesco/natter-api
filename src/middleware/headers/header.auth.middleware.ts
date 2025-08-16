import { BadRequestException, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { UsersService } from "src/users/users.service";
import * as bcrypt from "bcrypt";
import { UserDB } from "src/users/interfaces/user.interface";
import { TokenService } from "src/token/token.service";

/* @Injectable()
export class HeaderAuthMiddleware implements NestMiddleware {
    constructor(
        private readonly userService: UsersService,
        private readonly tokenService: TokenService
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            // Tenta validar o token
            await this.tokenService.validateToken(req);
            if (req['user']) {
                return next();
            }
        } catch (error) {
            console.error('Token validation error:', error.message);
        }

        const authorizationHeader = req.headers['authorization'];
        const acceptHeader = req.headers['accept'];

        this.checkHeaders(authorizationHeader, acceptHeader, res);

        const [authType, token] = authorizationHeader.split(' ');

        if (authType.toLowerCase() === 'basic') {
            this.checkToken(authType, res);

            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            const [username, password] = decoded.split(':');

            this.checkUsernameAndPassword(username, password, res);

            const regex = /^[a-zA-Z0-9\s]*$/;
            if (!regex.test(username)) throw new BadRequestException('O valor fornecido contém caracteres especiais não permitidos.');

            const user: UserDB = await this.userService.validateBasicAuth(username);
            this.checkUser(user, res);

            const isPasswordValid: boolean = await bcrypt.compare(password, user.pw_hash);
            this.checkPassword(isPasswordValid, res);

            req['user'] = {
                ...user,
                id: user.user_id
            };
        } else {
            return res.status(401).json({
                statusCode: 401,
                message: 'Unauthorized. Missing authorization header.',
                timestamp: new Date().toISOString(),
                path: req.path,
            });
        }

        next();
    }

    private checkHeaders(authorizationHeader: string, acceptHeader: string, res: Response): Response {
        if (!authorizationHeader) {
            if (acceptHeader?.includes('text/html')) {
                res.setHeader('WWW-Authenticate', 'Basic realm="Acesso ao Sistema"');
                res.status(401).send('Unauthorized');
            } else {
                return res.status(401).json({
                    statusCode: 401,
                    message: 'Unauthorized. Missing authorization header.',
                    timestamp: new Date().toISOString(),
                });
            }
        }
    }

    private checkToken(token: string, res: Response): Response {
        if (!token) {
            return res.status(401).json({
                statusCode: 401,
                message: 'Unauthorized. Missing credentials.',
                timestamp: new Date().toISOString(),
            });
        }
    }

    private checkUsernameAndPassword(username: string, password: string, res: Response): Response {
        if (!username || !password) {
            return res.status(401).json({
                statusCode: 401,
                message: 'Unauthorized. Invalid credentials format.',
                timestamp: new Date().toISOString(),
            });
        }
    }

    private checkUser(user: UserDB, res: Response): Response {
        if (!user) {
            return res.status(401).json({
                statusCode: 401,
                message: 'Unauthorized. User not found or password is missing.',
                timestamp: new Date().toISOString(),
            });
        }
    }

    private checkPassword(password: boolean, res: Response): Response {
        if (!password) {
            return res.status(401).json({
                statusCode: 401,
                message: 'Unauthorized. Invalid credentials.',
                timestamp: new Date().toISOString(),
            });
        }
    }
} */

    @Injectable()
export class HeaderAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly userService: UsersService,
    private readonly tokenService: TokenService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Tenta validar token de sessão (com CSRF)
      await this.tokenService.validateToken(req);
      if (req['user']) {
        return next(); // Usuário autenticado via token
      }
    } catch (error) {
      console.error('Token validation error:', error.message);
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized. Invalid or missing token.',
        timestamp: new Date().toISOString()
      });
    }

    const authorizationHeader = req.headers['authorization'];
    const acceptHeader = req.headers['accept'];

    if (!authorizationHeader) {
      // Se não houver header, bloqueia a requisição
      if (acceptHeader?.includes('text/html')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Acesso ao Sistema"');
        return res.status(401).send('Unauthorized');
      } else {
        return res.status(401).json({
          statusCode: 401,
          message: 'Unauthorized. Missing authorization header.',
          timestamp: new Date().toISOString()
        });
      }
    }

    const [authType, token] = authorizationHeader.split(' ');

    if (authType.toLowerCase() !== 'basic') {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized. Only Basic authentication is supported.',
        timestamp: new Date().toISOString()
      });
    }

    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized. Missing credentials.',
        timestamp: new Date().toISOString()
      });
    }

    // Decodifica e valida HTTP Basic
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    if (!username || !password) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized. Invalid credentials format.',
        timestamp: new Date().toISOString()
      });
    }

    const regex = /^[a-zA-Z0-9\s]*$/;
    if (!regex.test(username)) {
      throw new BadRequestException('O valor fornecido contém caracteres especiais não permitidos.');
    }

    const user: UserDB = await this.userService.validateBasicAuth(username);
    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized. User not found or password is missing.',
        timestamp: new Date().toISOString()
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.pw_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized. Invalid credentials.',
        timestamp: new Date().toISOString()
      });
    }

    // Autenticação bem-sucedida
    req['user'] = {
      ...user,
      id: user.user_id
    };

    next();
  }
}
