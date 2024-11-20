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

    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author VARCHAR(30) NOT NULL,
        message TEXT CHECK(LENGTH(message) <= 255),
        space_id INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author) REFERENCES users(user_id),
        FOREIGN KEY (space_id) REFERENCES spaces(id)
      )
    `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela "messages":', err);
      } else {
        console.log('Tabela "messages" criada com sucesso em memória.');
        dbInfo(db, 'messages');
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