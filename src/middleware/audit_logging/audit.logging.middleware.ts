import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../audit_logging/audit_logging.service';


@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private readonly auditService: AuditService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const auditId = await this.auditService.generateAuditId();
      req['audit_id'] = auditId;

      // Log inicial básico - sem informações de autenticação
      await this.auditService.logRequestStart({
        auditId,
        method: req.method,
        path: req.path
      });

      // Intercepta a resposta para casos de erro de autenticação
      res.on('finish', async () => {
        // Só registra aqui se for erro de autenticação (401/403)
        if (res.statusCode === 401 || res.statusCode === 403) {
          await this.auditService.logRequestEnd({
            auditId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode
          });
        }
      });

      next();
    } catch (error) {
      console.error('Erro no middleware de auditoria:', error);
      next(error);
    }
  }
}