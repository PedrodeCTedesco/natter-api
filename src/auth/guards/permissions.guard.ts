import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as sqlite3 from 'sqlite3';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('DATABASE') private readonly db: sqlite3.Database
  ) {}

  canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<string>('permission', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    const method = this.reflector.getAllAndOverride<string>('method', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    const request = context.switchToHttp().getRequest();

    if (!method || method !== request.method) throw new UnauthorizedException({ status: 401, message: 'Método não permitido' });
    if (!permission) throw new ForbiddenException({ status: 403, message: 'Permissão não definida'});


    const username = request.user?.user_id;
    if (!username) throw new UnauthorizedException({ status: 401, message: 'Usuário não autenticado' });


    const spaceId = request.params.spaceId;
    if (!spaceId) throw new ForbiddenException({ status: 403, message: 'ID do espaço não fornecido' });


    return new Promise((resolve, reject) => {
        this.db.get(
          'SELECT perms FROM permissions WHERE space_id = ? AND user_id = ?',
          [spaceId, username],
          (err, row: { perms: string }) => {
            if (err) {
              console.error('Database error:', err.message);
              return reject(new ForbiddenException('Erro ao verificar permissões'));
            }
      
            if (!row) {
              console.log('No permissions found for user');
              return reject(new ForbiddenException('Usuário sem permissão para este espaço'));
            }
      
            const userPerms = row.perms?.toLowerCase() || '';
            const requiredPermission = permission.toLowerCase();
      
            console.log('User permissions:', userPerms);
            console.log('Required permission:', requiredPermission);
      
            if (!userPerms.includes(requiredPermission)) {
              console.log('Permission denied for user');
              return reject(new ForbiddenException('Usuário não possui a permissão necessária'));
            }
      
            console.log('Permission granted');
            resolve(true);
          }
        );
    });
  }
}