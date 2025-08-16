import * as sqlite3 from 'sqlite3';
import { initializeDatabase, populateInitialData } from './database.config';
import { DATABASE_TOKEN } from 'src/interfaces/interfaces.tokens/token.database';

export const DatabaseProvider = {
  provide: DATABASE_TOKEN,
  useFactory: async () => {
    const db = new sqlite3.Database(':memory:');
    await initializeDatabase(db);
    await populateInitialData(db);
    return db;
  }
};