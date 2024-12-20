import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../audit_logging/audit_logging.service';
import { AUDIT_LOGGING_SERVICE } from 'src/audit_logging/constants/audit.logging.method.identifiers';


@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const auditId = request['audit_id'];
    const user = request['user'];

    if (user) {
      await this.auditService[AUDIT_LOGGING_SERVICE.UPDATE_LOG]({
        auditId,
        userId: user.id
      });
    }

    return next.handle().pipe(
      tap(async () => {
        if (response.statusCode !== 401 && response.statusCode !== 403) {
          await this.auditService[AUDIT_LOGGING_SERVICE.LOG_REQUEST_END]({
            auditId,
            method: request.method,
            path: request.path,
            statusCode: response.statusCode,
            userId: user?.id 
          });
        }
      }),
      catchError(async (error) => {
        if (error.status !== 401 && error.status !== 403) {
          await this.auditService[AUDIT_LOGGING_SERVICE.LOG_REQUEST_END]({
            auditId,
            method: request.method,
            path: request.path,
            statusCode: error.status || 500,
            userId: user?.id 
          });
        }
        return throwError(() => error);
      })
    );
  }
}