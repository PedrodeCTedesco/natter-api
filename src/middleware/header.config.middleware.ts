import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HeaderConfigMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Verifica se o Content-Type da requisição é application/json
    if (req.headers['content-type'] !== 'application/json') {
      return res.status(415).json({
        message: 'Unsupported Media Type. Only application/json is allowed.',
      });
    }

    // Configura o Content-Type da resposta para application/json
    res.setHeader('Content-Type', 'application/json');

    next();
  }
}
