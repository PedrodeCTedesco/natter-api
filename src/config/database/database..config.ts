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
      CREATE TABLE IF NOT EXISTS permissions (
        space_id INTEGER NOT NULL,
        user_id VARCHAR(30) NOT NULL,
        perms VARCHAR(3) NOT NULL,
        PRIMARY KEY (space_id, user_id),
        FOREIGN KEY (space_id) REFERENCES spaces(id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela "permissions":', err);
      } else {
        console.log('Tabela "permissions" criada com sucesso em memória.');
        dbInfo(db, 'permissions');
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

    db.run(`
      CREATE TABLE IF NOT EXISTS audit_log (
        audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
        method VARCHAR(10) NOT NULL,
        path VARCHAR(100) NOT NULL,
        user_id VARCHAR(30) NULL,
        status INTEGER NULL,
        audit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela "audit_log":', err);
      } else {
        console.log('Tabela "audit_log" criada com sucesso em memória.');
        dbInfo(db, 'audit_log');
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS audit_ids (
        id INTEGER PRIMARY KEY AUTOINCREMENT
      )
    `, (err) => {
        if (err) {
            console.error('Erro ao criar tabela "audit_ids":', err);
        } else {
            console.log('Tabela "audit_ids" criada com sucesso.');
            dbInfo(db, 'audit_ids');
        }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id INTEGER NOT NULL,
        event_type TEXT NOT NULL CHECK(event_type IN ('REQUEST_START', 'AUTH_INFO', 'REQUEST_END')),
        method TEXT,
        path TEXT,
        status INTEGER,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (audit_id) REFERENCES audit_ids(id)
      )
    `, (err) => {
        if (err) {
            console.error('Erro ao criar tabela "audit_events":', err);
        } else {
            console.log('Tabela "audit_events" criada com sucesso.');
            dbInfo(db, 'audit_events');
        }
    });

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_audit_id 
      ON audit_events(audit_id)
    `, (err) => {
        if (err) {
            console.error('Erro ao criar índice "idx_audit_events_audit_id":', err);
        } else {
            console.log('Índice "idx_audit_events_audit_id" criado com sucesso.');
        }
    });

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_created_at 
      ON audit_events(created_at)
    `, (err) => {
        if (err) {
            console.error('Erro ao criar índice "idx_audit_events_created_at":', err);
        } else {
            console.log('Índice "idx_audit_events_created_at" criado com sucesso.');
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