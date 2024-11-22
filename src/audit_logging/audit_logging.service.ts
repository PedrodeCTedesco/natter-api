import { Inject, Injectable } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';

@Injectable()
export class AuditService {
  constructor(
    @Inject('DATABASE') private readonly db: sqlite3.Database
  ) {}

  async generateAuditId(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT MAX(audit_id) + 1 as next_id FROM audit_log', [], (err, row: any) => {
        if (err) reject(err);
        resolve(row?.next_id || 1);
      });
    });
  }

  async logRequestStart(data: {
    auditId: number;
    method: string;
    path: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO audit_log (audit_id, method, path) VALUES (?, ?, ?)',
        [data.auditId, data.method, data.path],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  async updateRequestWithAuthInfo(data: {
    auditId: number;
    userId: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE audit_log SET user_id = ? WHERE audit_id = ?',
        [data.userId, data.auditId],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  async logRequestEnd(data: {
    auditId: number;
    method: string;
    path: string;
    statusCode: number;
    userId?: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO audit_log (audit_id, method, path, status, user_id) VALUES (?, ?, ?, ?, ?)',
        [data.auditId, data.method, data.path, data.statusCode, data.userId || null],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }
}