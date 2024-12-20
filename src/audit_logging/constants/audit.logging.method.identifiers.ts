export enum AUDIT_LOGGING_SERVICE {
    GENERATE_AUDIT_ID = 'create the log id',
    LOG_REQUEST_START = 'the initial log in audit event table',
    LOG_REQUEST_END = 'the final log in audit event table',
    UPDATE_LOG = 'update log in audit event table',
    FORMAT_LOG = 'format log info',
    GET_AUDIT_LOG_DETAILS = 'get all logs request end from audit event table',
    GET_AUDIT_LOG_STATISTICS = 'get logs request end with status count by http method',
    GET_AUDIT_LOGS_WITH_FILTERS = 'get logs filtered by user options'
}