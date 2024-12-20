import { Controller, Get, Query, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AuditLog } from './interfaces/audit.log.interface';
import { AuditService } from './audit_logging.service';
import { AUDIT_LOGGING_SERVICE } from './constants/audit.logging.method.identifiers';
import { escapeSpecialCharacters } from '../auth/input.validation/input.validation.helper';

@Injectable()
@Controller('audit')
export class AuditLoggingController {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async getAllLogs(): Promise<AuditLog[]> {
    return this.auditService[AUDIT_LOGGING_SERVICE.GET_AUDIT_LOG_DETAILS]();
  }

  @Get('logs')
  async getLogs(
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
    @Query('userId') userId?: string,
    @Query('method') method?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ logs: AuditLog[], total: number }> {

    if (isNaN(limit)) throw new HttpException('Invalid limit value', HttpStatus.BAD_REQUEST);

    limit = Math.min(Math.max(1, Number(limit)), 1000);
    offset = Math.max(0, Number(offset));
    const escapedUserId: string = escapeSpecialCharacters(userId);
    return await this.auditService[AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS](limit, offset, escapedUserId, method, startDate, endDate);
  }

  @Get('logs/summary')
  async getLogsSummary(): Promise<{
    totalRequests: number,
    requestsByMethod: { [key: string]: number },
    errorRate: number
  }> {
    return this.auditService[AUDIT_LOGGING_SERVICE.GET_AUDIT_LOG_STATISTICS]();
  }
}