import { PartialType } from '@nestjs/mapped-types';
import { CreateAuditLoggingDto } from './create-audit_logging.dto';

export class UpdateAuditLoggingDto extends PartialType(CreateAuditLoggingDto) {}
