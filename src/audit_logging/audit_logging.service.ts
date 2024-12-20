import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';
import { AuditLog } from './interfaces/audit.log.interface';
import { AUDIT_LOGGING_SERVICE } from './constants/audit.logging.method.identifiers';
import { HTTP_METHODS } from './constants/audit.logging.http';

@Injectable()
export class AuditService {
  constructor(
    @Inject('DATABASE') private readonly db: sqlite3.Database
  ) {}

  async [AUDIT_LOGGING_SERVICE.GENERATE_AUDIT_ID](): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT MAX(audit_id) + 1 as next_id FROM audit_events', [], (err, row: any) => {
        if (err) reject(err);
        resolve(row?.next_id || 1);
      });
    });
  }

  async [AUDIT_LOGGING_SERVICE.LOG_REQUEST_START](data: {
    auditId: number;
    method: string;
    path: string;
    user?: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO audit_events (
          audit_id, 
          event_type,
          method, 
          path,
          user_id,
          created_at
        ) VALUES (?, 'REQUEST_START', ?, ?, ?, datetime('now'))`,
        [data.auditId, data.method, data.path],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  async [AUDIT_LOGGING_SERVICE.UPDATE_LOG](data: {
    auditId: number;
    userId: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO audit_events (
          audit_id,
          event_type,
          user_id,
          created_at
        ) VALUES (?, 'AUTH_INFO', ?, datetime('now'))`,
        [data.auditId, data.userId],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  async [AUDIT_LOGGING_SERVICE.LOG_REQUEST_END](data: {
    auditId: number;
    method: string;
    path: string;
    statusCode: number;
    userId?: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO audit_events (
          audit_id,
          event_type,
          method,
          path,
          status,
          user_id,
          created_at
        ) VALUES (?, 'REQUEST_END', ?, ?, ?, ?, datetime('now'))`,
        [data.auditId, data.method, data.path, data.statusCode, data.userId || null],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  async [AUDIT_LOGGING_SERVICE.GET_AUDIT_LOG_DETAILS](): Promise<AuditLog[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          e.audit_id,
          e.method,
          e.path,
          e.status,
          e.user_id,
          e.created_at
        FROM audit_events e
        WHERE e.event_type = 'REQUEST_END'
        ORDER BY e.created_at DESC`, 
        [], 
        (err, rows) => {
          if (err) {
            console.error('Error fetching audit logs:', err);
            reject(new HttpException(
              'Failed to fetch audit logs',
              HttpStatus.INTERNAL_SERVER_ERROR
            ));
            return;
          }
          try {
            const logs = rows.map(row => this[AUDIT_LOGGING_SERVICE.FORMAT_LOG](row));
            resolve(logs);
          } catch (error) {
            reject(new HttpException(
              'Error processing audit logs',
              HttpStatus.INTERNAL_SERVER_ERROR
            ));
          }
        }
      );
    });
  }

  async [AUDIT_LOGGING_SERVICE.GET_AUDIT_LOG_STATISTICS](): Promise<{
    totalRequests: number,
    requestsByMethod: { [key: string]: number },
    errorRate: number
  }> {
    return new Promise((resolve, reject) => {
      const query = `
        WITH method_counts AS (
          SELECT method, COUNT(*) as count
          FROM audit_events
          WHERE event_type = 'REQUEST_END'
          GROUP BY method
        )
        SELECT 
          (SELECT COUNT(*) FROM audit_events WHERE event_type = 'REQUEST_END') as total,
          (SELECT COUNT(*) FROM audit_events WHERE event_type = 'REQUEST_END' AND status >= 400) as errors,
          json_group_object(method, count) as methods_count
        FROM method_counts
      `;

      this.db.get(query, [], (err, row: any) => {
        if (err) {
          console.error('Error getting logs summary:', err);
          reject(new HttpException(
            'Failed to get logs summary',
            HttpStatus.INTERNAL_SERVER_ERROR
          ));
          return;
        }

        try {
          const requestsByMethod = JSON.parse(row?.methods_count || '{}');
          const total = row?.total || 0;
          const errors = row?.errors || 0;
          
          resolve({
            totalRequests: total,
            requestsByMethod,
            errorRate: total > 0 ? (errors / total) * 100 : 0
          });
        } catch (error) {
          console.error('Error processing summary data:', error);
          reject(new HttpException(
            'Error processing summary data',
            HttpStatus.INTERNAL_SERVER_ERROR
          ));
        }
      });
    });
  }

  async [AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS](
    limit: number,
    offset: number,
    userId: string,
    method: string,
    startDate: string | Date,
    endDate: string | Date
  ): Promise<{ logs: AuditLog[], total: number }> {
    return new Promise((resolve, reject) => {
      try {

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
          reject(new HttpException('Start date cannot be later than end date', HttpStatus.BAD_REQUEST));
          return;
        }

        let query = `
          SELECT * FROM audit_events 
          WHERE event_type = 'REQUEST_END'
        `;
        const params: any[] = [];

        if (userId) {
          query += ' AND user_id = ?';
          params.push(userId);
        }

        if (Object.values(HTTP_METHODS).includes(method as HTTP_METHODS)) {
          query += ' AND method = ?';
          params.push(method.toUpperCase());
        }

        if (startDate) {
          query += ' AND created_at >= ?';
          params.push(new Date(startDate).toISOString());
        }

        if (endDate) {
          query += ' AND created_at <= ?';
          params.push(new Date(endDate).toISOString());
        }

        this.db.get(
          `SELECT COUNT(*) as count FROM (${query})`,
          params,
          (err, row: { count: number }) => {
            if (err) {
              console.error('Error counting audit logs:', err);
              reject(new HttpException(
                'Failed to count audit logs',
                HttpStatus.INTERNAL_SERVER_ERROR
              ));
              return;
            }

            const total = row.count;

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            this.db.all(query, params, (err, rows) => {
              if (err) {
                console.error('Error fetching audit logs:', err);
                reject(new HttpException(
                  'Failed to fetch audit logs',
                  HttpStatus.INTERNAL_SERVER_ERROR
                ));
                return;
              }

              try {
                const logs = rows.map(row => this[AUDIT_LOGGING_SERVICE.FORMAT_LOG](row));
                resolve({ logs, total });
              } catch (error) {
                reject(new HttpException(
                  'Error processing audit logs',
                  HttpStatus.INTERNAL_SERVER_ERROR
                ));
              }
            });
          }
        );
      } catch (error) {
        console.error('Error in getLogs:', error);
        reject(new HttpException(
          'Invalid parameters provided',
          HttpStatus.BAD_REQUEST
        ));
      }
    });
  }
  
  private [AUDIT_LOGGING_SERVICE.FORMAT_LOG](row: any): AuditLog {
    try {
      return {
        id: row.audit_id,
        method: row.method,
        path: row.path,
        status: row.status,
        user: row.user_id,
        time: new Date(row.created_at)
      };
    } catch (error) {
      console.error('Error converting row to AuditLog:', error);
      throw new HttpException(
        'Error processing audit log entry',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}