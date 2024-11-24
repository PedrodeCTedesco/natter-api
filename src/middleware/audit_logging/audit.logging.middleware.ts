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
        path: req.path,
        user: req['user']
      });

      next();
    } catch (error) {
      console.error('Erro no middleware de auditoria:', error);
      next(error);
    }
  }
}