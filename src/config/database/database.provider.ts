import * as sqlite3 from 'sqlite3';
import { initializeDatabase, populateInitialData } from './database.config';


export const DatabaseProvider = {
  provide: 'DATABASE',
  useFactory: async () => {
    const db = new sqlite3.Database(':memory:');
    await initializeDatabase(db);
    await populateInitialData(db);
    return db;
  }
};