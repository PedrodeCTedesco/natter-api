import { Module } from '@nestjs/common';
import { AuditService } from './audit_logging.service';
import { AuditLoggingController } from './audit_logging.controller';
import { DatabaseProvider } from 'src/config/database/database.provider';


@Module({
  controllers:[AuditLoggingController],
  providers: [
    AuditService,
    DatabaseProvider
  ],
  exports: [AuditService]
})
export class AuditLoggingModule {}
