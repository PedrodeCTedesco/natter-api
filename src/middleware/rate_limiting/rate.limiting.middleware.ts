import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ThrottleLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ThrottleLoggerMiddleware.name);
  private requestCounts = new Map<string, { count: number; timestamp: number }>();

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const path = req.path;
    const currentTime = Date.now();
    
    // Log da requisição recebida
    this.logger.debug(`Incoming request from IP: ${ip} to path: ${path}`);
    
    // Gerenciamento do contador de requisições
    const requestInfo = this.requestCounts.get(ip) || { count: 0, timestamp: currentTime };
    
    if (currentTime - requestInfo.timestamp > 1000) {
      requestInfo.count = 0;
      requestInfo.timestamp = currentTime;
    }
    
    requestInfo.count++;
    this.requestCounts.set(ip, requestInfo);

    this.logger.log(`Request count for IP ${ip}: ${requestInfo.count} in last second`);

    // Log da resposta usando event listener
    res.on('finish', () => {
      this.logger.debug(`Response status for ${path}: ${res.statusCode}`);
      
      // Log adicional para respostas de throttling
      if (res.statusCode === 429) {
        this.logger.warn(`Rate limit exceeded for IP ${ip} on path ${path}`);
      }
    });

    next();
  }
}