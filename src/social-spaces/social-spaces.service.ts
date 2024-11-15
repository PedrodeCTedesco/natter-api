import { Injectable } from '@nestjs/common';
import { CreateSocialSpaceDto } from './dto/create-social-space.dto';
import { Response } from 'express';
import { Logger } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';


@Injectable()
export class SocialSpacesService {
  private readonly logger = new Logger(SocialSpacesService.name);
  private db: sqlite3.Database;

  constructor() {
    // Inicializa o banco SQLite em memória
    this.db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        this.logger.error('Erro ao conectar ao SQLite:', err);
      } else {
        this.logger.debug('Conectado ao SQLite em memória');
        this.initialize();
      }
    });
  }

  // seguro e simples
  async create(createSocialSpaceDto: CreateSocialSpaceDto, res: Response): Promise<{ uri: string }> {
    this.logger.debug('Método seguro acionado');
    
    try {
      const spaceId = await new Promise<number>((resolve, reject) => {
        this.db.run(
          'INSERT INTO spaces (name, owner) VALUES (?, ?)',
          [createSocialSpaceDto.name, createSocialSpaceDto.owner],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
  
      const spaceUri = `http://localhost:3000/spaces/${spaceId}`;
  
      // Segunda query para atualizar a URI
      await new Promise<void>((resolve, reject) => {
        this.db.run(
          'UPDATE spaces SET uri = ? WHERE id = ?',
          [spaceUri, spaceId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
  
      res.status(201)
          .header('Location', spaceUri)
          .json({ uri: spaceUri });
  
      return { uri: spaceUri };
  
    } catch (error) {
      this.logger.error('Erro ao criar space:', error);
      throw error;
    }
  }

  // vulnerável
  async createSQLInjectionVulnerability(createSocialSpaceDto: any, res: Response): Promise<any> {
    this.logger.debug('Método vulnerável acionado!');
    
    const { name, owner } = createSocialSpaceDto;

    // Query vulnerável com SQL Injection
    const query = `INSERT INTO spaces(name, owner) VALUES('${name}', '${owner}');`;

    try {
      // Executa a transação vulnerável
      this.db.exec(`BEGIN TRANSACTION; ${query} COMMIT;`, (err) => {
        if (err) {
          this.logger.error('Erro ao executar a query: ', err.message);
          res.status(500).json({ error: 'Erro ao executar a transação' });
          return;
        }

        this.logger.debug(`Comando SQL gerado: ${query}`);
        
        // Tenta obter o ID do último registro inserido
        this.db.get("SELECT last_insert_rowid() as id;", [], (err, row: any) => {
          if (err || !row || !row.id) {
            this.logger.error('Erro ao acessar o último ID.');
            res.status(500).json({ error: 'Erro ao acessar o ID.' });
            return;
          }

          const spaceId = row.id;
          const spaceUri = `/spaces/${spaceId}`;

          // Configura a resposta HTTP
          res.status(201).header('Location', spaceUri).json({
            uri: spaceUri
          });

          return { uri: spaceUri };
        });
      });
    } catch (error) {
      this.logger.error(`Erro ao executar a query: ${error.message}`);
      res.status(500).json({ error: 'Erro ao executar a query' });
      return { error: 'Erro ao executar a query' };
    }
  }

  // seguro e complexo
  async createSQLInjectionVulnerabilityWithSolution(createSocialSpaceDto: any, res: Response): Promise<any> {
    this.logger.debug('Método sanitarizado acionado!');
    
    const { name, owner } = createSocialSpaceDto;
    
    // Query parametrizada para evitar SQL Injection
    const query = `INSERT INTO spaces(name, owner) VALUES(?, ?)`;
  
    const stmt = this.db.prepare(query); // Prepare a declaração uma vez
  
    try {
      // Inicia a transação
      this.db.run("BEGIN TRANSACTION;", (err) => {
        if (err) {
          this.logger.error('Erro ao iniciar a transação: ', err.message);
          res.status(500).json({ error: 'Erro ao iniciar a transação' });
          return;
        }
  
        // Executa o statement com os parâmetros fornecidos
        stmt.run([name, owner], (err) => {
          if (err) {
            this.logger.error('Erro ao executar a query preparada: ', err.message);
            this.db.run("ROLLBACK;", (rollbackErr) => {
              if (rollbackErr) {
                this.logger.error('Erro ao reverter a transação: ', rollbackErr.message);
              }
              res.status(500).json({ error: 'Erro ao executar a query preparada' });
            });
            return;
          }
  
          // Finaliza o statement após a execução
          stmt.finalize();
  
          this.logger.debug(`Comando SQL executado com segurança: ${query}`);
  
          // Tenta obter o ID do último registro inserido
          this.db.get("SELECT last_insert_rowid() as id;", [], (err, row: any) => {
            if (err || !row || !row.id) {
              this.logger.error('Erro ao acessar o último ID.');
              this.db.run("ROLLBACK;", (rollbackErr) => {
                if (rollbackErr) {
                  this.logger.error('Erro ao reverter a transação: ', rollbackErr.message);
                }
                res.status(500).json({ error: 'Erro ao acessar o ID' });
              });
              return;
            }
  
            const spaceId = row.id;
            const spaceUri = `http://localhost:3000/spaces/${spaceId}`;
  
            // Commit da transação após inserir o dado com sucesso
            this.db.run("COMMIT;", (err) => {
              if (err) {
                this.logger.error('Erro ao finalizar a transação: ', err.message);
                res.status(500).json({ error: 'Erro ao finalizar a transação' });
                return;
              }
  
              // Retorna a URI do novo recurso
              res.status(201).header('Location', spaceUri).json({
                uri: spaceUri,
              });
  
              return { uri: spaceUri };
            });
          });
        });
      });
    } catch (error) {
      this.logger.error(`Erro ao executar a query: ${error.message}`);
      res.status(500).json({ error: 'Erro ao executar a query' });
      return { error: 'Erro ao executar a query' };
    }
  }
  
  async findAll(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM spaces', [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }
    
  private initialize() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS spaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        owner TEXT,
        uri TEXT
      )
    `, (err) => {
      if (err) {
        this.logger.error('Erro ao criar tabela:', err);
      } else {
        this.logger.debug('Tabela "spaces" criada com sucesso em memória.');
      }
    });
  }
}
