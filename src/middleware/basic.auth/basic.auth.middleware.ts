import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { UserDB } from 'src/users/interfaces/user.interface';
import { USER_METHODS } from 'src/users/constants/identifiers.methods';

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UsersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Missing Authorization header' });
    }

    const [authType, token] = authHeader.split(' ');
    if (!token || authType.toLowerCase() !== 'basic') {
      return res.status(401).json({ message: 'Invalid Authorization header' });
    }

    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    if (!username || !password) {
      return res.status(401).json({ message: 'Invalid HTTP Basic format' });
    }

    const user: UserDB = await this.userService[USER_METHODS.VALIDATION](username);
    if (!user || !(await bcrypt.compare(password, user.pw_hash))) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    req['user'] = { 
      ...user, 
      id: user.user_id, 
       username: user.user_id 
    };
    next();
  }
}
