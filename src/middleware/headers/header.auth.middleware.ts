import { BadRequestException, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { UsersService } from "src/users/users.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class HeaderAuthMiddleware implements NestMiddleware {
    constructor(private readonly userService: UsersService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const authorizationHeader = req.headers['authorization'];

        if (!authorizationHeader) {
            return res.status(401).json({
                statusCode: 401,
                message: 'Unauthorized. Missing authorization header.',
                timestamp: new Date().toISOString(),
            });
        }

        const [authType, token] = authorizationHeader.split(' ');

        if (authType.toLowerCase() === 'basic') {
            if (!token) {
                return res.status(401).json({
                    statusCode: 401,
                    message: 'Unauthorized. Missing credentials.',
                    timestamp: new Date().toISOString(),
                });
            }

            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            const [username, password] = decoded.split(':');

            if (!username || !password) {
                return res.status(401).json({
                    statusCode: 401,
                    message: 'Unauthorized. Invalid credentials format.',
                    timestamp: new Date().toISOString(),
                });
            }

            const regex = /^[a-zA-Z0-9\s]*$/;
            if (!regex.test(username)) throw new BadRequestException('O valor fornecido contém caracteres especiais não permitidos.');

            const user = await this.userService.validateBasicAuth(username);
            if (!user) {
                return res.status(401).json({
                    statusCode: 401,
                    message: 'Unauthorized. User not found or password is missing.',
                    timestamp: new Date().toISOString(),
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.pw_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    statusCode: 401,
                    message: 'Unauthorized. Invalid credentials.',
                    timestamp: new Date().toISOString(),
                });
            }

            req['user'] = user;
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
}
