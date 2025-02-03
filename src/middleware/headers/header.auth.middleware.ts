import { BadRequestException, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { UsersService } from "src/users/users.service";
import * as bcrypt from "bcrypt";
import { UserDB } from "src/users/interfaces/user.interface";

@Injectable()
export class HeaderAuthMiddleware implements NestMiddleware {
    constructor(private readonly userService: UsersService) {}

    async use(req: Request, res: Response, next: NextFunction) {
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
}