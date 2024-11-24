import { SetMetadata } from '@nestjs/common';

export const RequirePermission = (method: string, permission: string) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    SetMetadata('permission', permission)(target, key, descriptor);
    SetMetadata('method', method)(target, key, descriptor);
  };
}