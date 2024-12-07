import * as sqlite3 from 'sqlite3';
import * as bcrypt from 'bcrypt';
import { promisify } from 'util';

export async function initializeDatabase(db: sqlite3.Database) {
  const runAsync = promisify(db.run.bind(db));
  
  try {
    await runAsync(`
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

    await runAsync(`
        CREATE TABLE IF NOT EXISTS users (
          user_id VARCHAR(30) PRIMARY KEY,
          pw_hash VARCHAR(255) NOT NULL,
          permissions VARCHAR(4) DEFAULT 'u'
        )
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela "users":', err);
        } else {
          console.log('Tabela "users" criada com sucesso em memória.');
          dbInfo(db, 'users');
        }
    });

    await runAsync(`
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

    await runAsync(`
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

    await runAsync(`
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

    await runAsync(`
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

    await runAsync(`
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

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_audit_id 
      ON audit_events(audit_id)
    `, (err) => {
        if (err) {
            console.error('Erro ao criar índice "idx_audit_events_audit_id":', err);
        } else {
            console.log('Índice "idx_audit_events_audit_id" criado com sucesso.');
        }
    });

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_created_at 
      ON audit_events(created_at)
    `, (err) => {
        if (err) {
            console.error('Erro ao criar índice "idx_audit_events_created_at":', err);
        } else {
            console.log('Índice "idx_audit_events_created_at" criado com sucesso.');
        }
    });
  } catch(err) {
    console.error('Error initializing database:', err);
    throw err;
  }
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

export async function populateInitialData(db: sqlite3.Database): Promise<void> {
  const runAsync = promisify(db.run.bind(db));
  const getAsync = promisify(db.get.bind(db));
  
  try {
    // Create admin user with hashed password
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminPassword, salt);

    // Insert admin user
    await runAsync(
      'INSERT OR IGNORE INTO users (user_id, pw_hash) VALUES (?, ?)',
      [adminUsername, hash]
    );

    // Create default space
    await runAsync(
      'INSERT OR IGNORE INTO spaces (name, owner, uri) VALUES (?, ?, ?)',
      ['Default Space', adminUsername, '/default']
    );

    // Get the space ID
    const spaceRow = await getAsync('SELECT last_insert_rowid() as spaceId');
    const spaceId = spaceRow.spaceId;

    // Add admin permissions
    await runAsync(
      'INSERT OR IGNORE INTO permissions (space_id, user_id, perms) VALUES (?, ?, ?)',
      [spaceId, adminUsername, 'a']
    );

    console.log('Initial data populated successfully');
  } catch (error) {
    console.error('Error populating initial data:', error);
    throw error;
  }
}