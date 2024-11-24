import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../audit_logging/audit_logging.service';


@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const auditId = request['audit_id'];
    const user = request['user']; // Recupera o usuário da mesma forma que no middleware

    // Atualiza com informações do usuário se autenticado
    if (user) {
      await this.auditService.updateRequestWithAuthInfo({
        auditId,
        userId: user.id
      });
    }

    return next.handle().pipe(
      tap(async () => {
        // Não loga novamente se foi erro de autenticação
        if (response.statusCode !== 401 && response.statusCode !== 403) {
          await this.auditService.logRequestEnd({
            auditId,
            method: request.method,
            path: request.path,
            statusCode: response.statusCode,
            userId: user?.id // Use a variável user que recuperamos
          });
        }
      }),
      catchError(async (error) => {
        if (error.status !== 401 && error.status !== 403) {
          await this.auditService.logRequestEnd({
            auditId,
            method: request.method,
            path: request.path,
            statusCode: error.status || 500,
            userId: user?.id // Use a variável user que recuperamos
          });
        }
        return throwError(() => error);
      })
    );
  }
}