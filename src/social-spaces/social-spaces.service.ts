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

  /** Versão fornecida pelo autor, com vulnerabilidade SQL Injection */
/*   async createSQLInjectionVulnerability(createSocialSpaceDto: CreateSocialSpaceDto, res: Response): Promise<{ uri: string }> {
    this.logger.debug('Método vulnerável acionado!')
    const { name, owner } = createSocialSpaceDto;

    // Aqui está a vulnerabilidade de SQL Injection, pois estamos concatenando as entradas diretamente na consulta
    await this.socialSpaceRepository.query(
      `INSERT INTO spaces(name, owner) VALUES('${name}', '${owner}');`
    );

    const result = await this.socialSpaceRepository.query(`SELECT last_insert_rowid() as id;`);
    const spaceId = result[0].id;

    const spaceUri = `http://localhost:3000/spaces/${spaceId}`;

    // Configura o cabeçalho Location na resposta HTTP
    res.setHeader('Location', spaceUri);

    // Retorna a URI no corpo da resposta com status 201
    res.status(201).json({ uri: spaceUri });

    return { uri: spaceUri };
  } */

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
