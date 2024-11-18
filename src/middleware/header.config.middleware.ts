import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HeaderConfigMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {

      if (!req.headers['content-type']) {
        return res.status(415).json({
          statusCode: 415,
          message: 'Unsupported Media Type. Only application/json is allowed.',
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }
      

      if (!req.headers['content-type'].includes('application/json')) {
        return res.status(415).json({
          statusCode: 415,
          message: 'Unsupported Media Type. Only application/json is allowed.',
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }
    }


    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');

    next();
  }
}