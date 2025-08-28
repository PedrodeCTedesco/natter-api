import * as sqlite3 from 'sqlite3';
import { initializeDatabase, populateInitialData } from './database.config';
import { DATABASE_TOKEN } from 'src/interfaces/interfaces.tokens/token.database';

let dbInstance: sqlite3.Database;

export const DatabaseProvider = {
  provide: DATABASE_TOKEN,
  useFactory: async () => {
    if (!dbInstance) {
      dbInstance = new sqlite3.Database(':memory:');
      await initializeDatabase(dbInstance);
      await populateInitialData(dbInstance);
    }
    return dbInstance;
  },
};