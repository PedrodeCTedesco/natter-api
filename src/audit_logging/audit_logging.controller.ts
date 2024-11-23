import { Controller, Get, Query, Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';
import { AuditLog } from './interfaces/audit.log.interface';

@Injectable()
@Controller('audit')
export class AuditLoggingController {
  constructor(@Inject('DATABASE') private readonly db: sqlite3.Database) {}

  private recordToAuditLog(row: any): AuditLog {
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

  @Get()
  async getAllLogs(): Promise<AuditLog[]> {
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
            const logs = rows.map(row => this.recordToAuditLog(row));
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

  @Get('logs')
  async getLogs(
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
    @Query('userId') userId?: string,
    @Query('method') method?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ logs: AuditLog[], total: number }> {
    return new Promise((resolve, reject) => {
      try {
        limit = Math.min(Math.max(1, Number(limit)), 1000);
        offset = Math.max(0, Number(offset));

        let query = `
          SELECT * FROM audit_events 
          WHERE event_type = 'REQUEST_END'
        `;
        const params: any[] = [];

        if (userId) {
          query += ' AND user_id = ?';
          params.push(userId);
        }

        if (method) {
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
                const logs = rows.map(row => this.recordToAuditLog(row));
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

  @Get('logs/summary')
  async getLogsSummary(): Promise<{
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
}