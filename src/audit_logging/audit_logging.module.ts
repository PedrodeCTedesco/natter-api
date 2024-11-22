import { Module } from '@nestjs/common';
import { AuditService } from './audit_logging.service';
import { DatabaseModule } from '../config/database/database.module';


@Module({
  imports:[
    DatabaseModule
  ],
  providers: [AuditService],
  exports: [AuditService]
})
export class AuditLoggingModule {}
