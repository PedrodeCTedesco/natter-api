import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../audit_logging/audit_logging.service';
import { AUDIT_LOGGING_SERVICE } from 'src/audit_logging/constants/audit.logging.method.identifiers';


@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private readonly auditService: AuditService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const auditId = await this.auditService[AUDIT_LOGGING_SERVICE.GENERATE_AUDIT_ID]();
      req['audit_id'] = auditId;

      await this.auditService[AUDIT_LOGGING_SERVICE.LOG_REQUEST_START]({
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