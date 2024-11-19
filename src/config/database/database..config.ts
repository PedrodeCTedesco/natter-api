import * as sqlite3 from 'sqlite3';

export function initializeDatabase(db: sqlite3.Database) {
    db.run(`
      CREATE TABLE IF NOT EXISTS spaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        owner TEXT,
        uri TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela:', err);
      } else {
        console.log('Tabela "spaces" criada com sucesso em memória.');
        dbInfo(db, 'spaces');
      }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
          user_id VARCHAR(30) PRIMARY KEY,
          pw_hash VARCHAR(255) NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela "users":', err);
        } else {
          console.log('Tabela "users" criada com sucesso em memória.');
          dbInfo(db, 'users');
        }
    });
  }

  function dbInfo(db: sqlite3.Database, tableName: string) {
    db.all(`PRAGMA table_info(${tableName});`, [], (err, rows) => {
      if (err) {
        console.error(`Erro ao consultar o esquema da tabela "${tableName}":`, err.message);
      } else {
        console.log(`Esquema da tabela "${tableName}":`, rows);
      }
    });
  }