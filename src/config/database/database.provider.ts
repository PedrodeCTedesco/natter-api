import * as sqlite3 from 'sqlite3';
import { initializeDatabase } from './database..config';

export const DatabaseProvider = {
  provide: 'DATABASE',
  useFactory: () => {
    const db = new sqlite3.Database(':memory:');
    initializeDatabase(db);
    return db;
  }
};
