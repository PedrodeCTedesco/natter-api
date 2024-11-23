import { Module } from '@nestjs/common';
import { AuditService } from './audit_logging.service';
import { DatabaseModule } from '../config/database/database.module';
import { AuditLoggingController } from './audit_logging.controller';


@Module({
  imports:[
    DatabaseModule
  ],
  controllers:[AuditLoggingController],
  providers: [AuditService],
  exports: [AuditService]
})
export class AuditLoggingModule {}
