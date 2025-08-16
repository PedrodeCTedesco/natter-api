import { AUDIT_LOGGING_SERVICE } from "src/audit_logging/constants/audit.logging.method.identifiers";
import { AuditLog } from "src/audit_logging/interfaces/audit.log.interface";

export interface IAuditService {
    [AUDIT_LOGGING_SERVICE.GENERATE_AUDIT_ID](): Promise<number>,
    [AUDIT_LOGGING_SERVICE.LOG_REQUEST_START](data: {
        auditId: number;
        method: string;
        path: string;
        user?: string;
    }): Promise<void>,
    [AUDIT_LOGGING_SERVICE.UPDATE_LOG](data: {
        auditId: number;
        userId: string;
    }): Promise<void>,
    [AUDIT_LOGGING_SERVICE.LOG_REQUEST_END](data: {
        auditId: number;
        method: string;
        path: string;
        statusCode: number;
        userId?: string;
    }): Promise<void>,
    [AUDIT_LOGGING_SERVICE.GET_AUDIT_LOG_DETAILS](): Promise<AuditLog[]>,
    [AUDIT_LOGGING_SERVICE.GET_AUDIT_LOG_STATISTICS](): Promise<{
        totalRequests: number,
        requestsByMethod: { [key: string]: number },
        errorRate: number
    }>,
    [AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS](
        limit: number,
        offset: number,
        userId: string,
        method: string,
        startDate: string | Date,
        endDate: string | Date
    ): Promise<{ logs: AuditLog[], total: number }>    
}