import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialSpace } from './entities/social-space.entity';
import { CreateSocialSpaceDto } from './dto/create-social-space.dto';
import { Message } from '../messages/entities/message.entity';
import { Response } from 'express';
import { Logger } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';


@Injectable()
export class SocialSpacesService {
  private readonly logger = new Logger(SocialSpacesService.name);
  private readonly db: sqlite3.Database;

  constructor(
    @InjectRepository(SocialSpace)
    private readonly socialSpaceRepository: Repository<SocialSpace>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>
  ) {
    this.db = new sqlite3.Database(':memory:', sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        this.logger.error('Erro ao conectar ao banco de dados:', err.message);
      }
    });
    this.createSpacesTable();
  }

  /** Versão inicial feita por mim */
  async create(createSocialSpaceDto: CreateSocialSpaceDto, res: Response): Promise<{ uri: string }> {
    this.logger.debug("Método seguro acionado!")
    // Cria o novo espaço social
    const newSpace = this.socialSpaceRepository.create({
      ...createSocialSpaceDto,
      uri: '',
    });

    // Salva o novo espaço no banco de dados
    const savedSpace = await this.socialSpaceRepository.save(newSpace);

    // Atualiza a URI do espaço
    savedSpace.uri = `http://localhost:3000/spaces/${savedSpace.id}`;

    // Salva novamente para garantir que a URI seja persistida
    await this.socialSpaceRepository.save(savedSpace);

    // Configura o cabeçalho Location na resposta HTTP
    res.setHeader('Location', savedSpace.uri);

    // Retorna a URI no corpo da resposta com status 201
    res.status(201).json({ uri: savedSpace.uri });

    return { uri: savedSpace.uri }; // Retorno adicional para garantir compatibilidade
  }

  async createSocialSpace(name: string, owner: string, res: Response): Promise<{ uri: string }> {
    const query = 'INSERT INTO spaces(name, owner) VALUES(?, ?)';

    try {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION;", (err) => {
          if (err) {
            this.logger.error('Error starting transaction:', err.message);
            res.status(500).json({ error: 'Error starting transaction' });
            return;
          }

          this.db.run(query, [name, owner], (err) => {
            if (err) {
              this.logger.error('Error executing query:', err.message);
              this.db.run("ROLLBACK;", (rollbackErr) => {
                if (rollbackErr) {
                  this.logger.error('Error rolling back transaction:', rollbackErr.message);
                }
                res.status(500).json({ error: 'Error executing query' });
              });
              return;
            }

            this.db.get("SELECT last_insert_rowid() as id;", [], (err, row: any) => {
              if (err || !row || !row.id) {
                this.logger.error('Failed to get last inserted ID due to table deletion!');
                this.db.run("ROLLBACK;", (rollbackErr) => {
                  if (rollbackErr) {
                    this.logger.error('Error rolling back transaction:', rollbackErr.message);
                  }
                  res.status(500).json({ error: 'Table deleted!' });
                });
                return;
              }

              const spaceId = row.id;
              const spaceUri = `/spaces/${spaceId}`;

              this.db.run("COMMIT;", (err) => {
                if (err) {
                  this.logger.error('Error committing transaction:', err.message);
                  res.status(500).json({ error: 'Error committing transaction' });
                  return;
                }

                res.status(201).header('Location', spaceUri).json({
                  uri: spaceUri
                });

                return { uri: spaceUri };
              });
            });
          });
        });
      });
    } catch (error) {
      this.logger.error(`Error executing query: ${error.message}`);
      res.status(500).json({ error: 'Error executing query' });
      return { uri: 'Error executing query' };
    }
  }

  async createSQLInjectionVulnerability(createSocialSpaceDto: any, res: Response): Promise<any> {
    this.logger.debug('Método vulnerável acionado!');
    
    const { name, owner } = createSocialSpaceDto;
  
    // Query vulnerável com SQL Injection
    const query = `INSERT INTO spaces(name, owner) VALUES('${name}', '${owner}');`;
  
    try {
      // Inicia uma transação usando db.serialize para garantir a execução sequencial dos comandos
      this.db.serialize(() => {
        // Inicia a transação
        this.db.run("BEGIN TRANSACTION;", (err) => {
          if (err) {
            this.logger.error('Erro ao iniciar a transação: ', err.message);
            res.status(500).json({ error: 'Erro ao iniciar a transação' });
            return;
          }
  
          // Executa a query de inserção vulnerável
          this.db.run(query, [], (err) => {
            if (err) {
              this.logger.error('Erro ao executar a query: ', err.message);
              this.db.run("ROLLBACK;", (rollbackErr) => {
                if (rollbackErr) {
                  this.logger.error('Erro ao reverter transação: ', rollbackErr.message);
                }
                res.status(500).json({ error: 'Erro ao executar a query' });
              });
              return;
            }
            this.logger.debug(`Comando SQL gerado: ${query}`);
  
            // Tenta obter o ID do último registro inserido
            this.db.get("SELECT last_insert_rowid() as id;", [], (err, row: any) => {
              if (err || !row || !row.id) {
                this.logger.error('Falha ao acessar o ID devido à exclusão da tabela!');
                this.db.run("ROLLBACK;", (rollbackErr) => {
                  if (rollbackErr) {
                    this.logger.error('Erro ao reverter transação: ', rollbackErr.message);
                  }
                  res.status(500).json({ error: 'Tabela excluída!' });
                });
                return;
              }
  
              const spaceId = row.id;
              const spaceUri = `/spaces/${spaceId}`;
  
              // Finaliza a transação
              this.db.run("COMMIT;", (err) => {
                if (err) {
                  this.logger.error('Erro ao finalizar a transação: ', err.message);
                  res.status(500).json({ error: 'Erro ao finalizar a transação' });
                  return;
                }
  
                // Configura a resposta HTTP
                res.status(201).header('Location', spaceUri).json({
                  uri: spaceUri
                });
  
                return { uri: spaceUri };
              });
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
    

  async addMessage(spaceId: string, messageData: { author: string, message: string }) {

    const socialSpace = await this.socialSpaceRepository.findOne({
      where: { id: parseInt(spaceId) }, 
    });
  
    if (!socialSpace) {
      throw new Error('Space not found'); 
    }
  

    const newMessage = this.messageRepository.create({
      author: messageData.author, 
      msg_txt: messageData.message, 
      spaceId: spaceId, 
    });
  
    await this.messageRepository.save(newMessage);
  
    return newMessage;
  }

  async getAllSpaces(): Promise<SocialSpace[]> {
    return this.socialSpaceRepository.find();
  }

  async getAllSocialSpaces(): Promise<SocialSpace[]> {
    const query = 'SELECT name, owner FROM spaces';

    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows: any) => {
        if (err) {
          this.logger.error('Error executing query:', err.message);
          reject(err);
        } else {
          // Check if the table exists before returning the results
          this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='spaces'", (err, tableInfo) => {
            if (err || !tableInfo) {
              this.logger.error('Error checking if the table exists:', err.message);
              resolve([]);
            } else {
              resolve(rows);
            }
          });
        }
      });
    });
  }

  private createSpacesTable(): void {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS spaces (
        space_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        owner TEXT NOT NULL
      );
    `;
    this.db.run(createTableQuery, (err) => {
      if (err) {
        this.logger.error('Erro ao criar a tabela spaces:', err.message);
      } else {
        this.logger.debug('Tabela "spaces" criada com sucesso em memória.');
      }
    });
  }
}
