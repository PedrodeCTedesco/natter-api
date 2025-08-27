import { BadRequestException, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { UsersService } from "src/users/users.service";
import * as bcrypt from "bcrypt";
import { UserDB } from "src/users/interfaces/user.interface";
import { TokenService } from "src/token/token.service";
import { PATHS_TO_IGNORE_AUTH } from "../constants/path.to.ignore.constats";

@Injectable()
export class HeaderAuthMiddleware implements NestMiddleware {
    constructor(
        private readonly userService: UsersService,
        private readonly tokenService: TokenService
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        // Lista de caminhos a serem ignorados pela validação de token e autenticação
        const ignoredPaths = Object.values(PATHS_TO_IGNORE_AUTH) as string[];
        // Se a requisição for para um caminho ignorado, pule o middleware
        if (ignoredPaths.includes(req.path)) {
            return next();
        }

        // Lógica de autenticação com token de sessão (preferencial)
        try {
            // Tenta validar token de sessão (com CSRF)
            await this.tokenService.validateToken(req);
            if (req['user']) {
              return next(); // Usuário autenticado via token, continue
            }
        } catch (error) {
            // Se a validação do token de sessão falhou, a requisição é inválida.
            // O frontend deve enviar um token CSRF válido para rotas protegidas.
            console.error('Token validation error:', error.message);
            return res.status(401).json({
                statusCode: 401,
                message: 'Unauthorized. Invalid or missing token.',
                timestamp: new Date().toISOString()
            });
        }

        // Lógica de autenticação com Basic Auth (apenas para o login inicial)
        const authorizationHeader = req.headers['authorization'];
        const acceptHeader = req.headers['accept'];

        if (!authorizationHeader) {
            // Se não houver header, bloqueia a requisição
            if (acceptHeader?.includes('text/html')) {
                /**
                 * Tecnicamente, é uma violação do padrão HTTP enviar uma resposta HTTP 401 e não enviar junto o cabeçalho WWW-Authenticate.
                 * Porém, atualmente este padrão é muito comum, por isso por uso é considerado normal.
                 */
                // res.setHeader('WWW-Authenticate', 'Basic realm="Acesso ao Sistema"');
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
          id: user.user_id,
          username: user.user_id
        };

        next();
    }
}