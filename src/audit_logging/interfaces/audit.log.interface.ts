export interface AuditLog {
    id: number;
    method: string;
    path: string;
    status: number;
    user: string | null;
    time: Date;
  }