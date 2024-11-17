import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HeaderConfigMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Ignora verificação de Content-Type para certas requisições
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      const contentType = req.headers['content-type'];
      if (!contentType?.includes('application/json')) {
        return res.status(415).json({
          statusCode: 415,
          message: 'Unsupported Media Type. Only application/json is allowed.',
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }
    }

    // Define Content-Type apenas se ainda não estiver definido
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json');
    }

    next();
  }
}