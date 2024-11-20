import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateSocialSpaceDto } from './dto/create-social-space.dto';
import { Response } from 'express';
import { Logger } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';
import { UpdateSocialSpaceDto } from './dto/update-social-space.dto';
import { AuthService } from '../auth/auth.service';
import { escapeSpecialCharacters, validateUserInput, validateUserInputFormat } from '../auth/input.validation/input.validation.helper';


@Injectable()
export class SocialSpacesService {
  private readonly logger = new Logger(SocialSpacesService.name);

  constructor(
    @Inject('DATABASE') private readonly db: sqlite3.Database
  ) {}

  // seguro e simples
  async create(createSocialSpaceDto: CreateSocialSpaceDto, res: Response): Promise<{ uri: string }> {
    this.logger.debug('Método seguro acionado');

    const user = AuthService.getAuthenticatedUser(res.req);
    if(!user) throw new UnauthorizedException('Usuário não autorizado');

    try {
      validateUserInput(createSocialSpaceDto.name, createSocialSpaceDto.owner, res);
      validateUserInputFormat(createSocialSpaceDto.name, createSocialSpaceDto.owner, res)
    } catch (error) {
      this.logger.error('Erro de validação:', error.message);
      throw error;
    }
    
    try {

      const escapedName: string = escapeSpecialCharacters(createSocialSpaceDto.name);
      const escapedOwner: string = escapeSpecialCharacters(createSocialSpaceDto.owner);

      const spaceId = await new Promise<number>((resolve, reject) => {
        // segurança contra SQL injection. Uso de declarações parametrizadas
        this.db.run(
          'INSERT INTO spaces (name, owner) VALUES (?, ?)',
          [escapedName, escapedOwner],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
  
      const spaceUri = `http://localhost:3000/spaces/${spaceId}`;
  
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
    this.logger.debug(`query maliciosa: ${query}`)

    try {
      // Executa a transação vulnerável
      this.db.exec(`${query} COMMIT;`, (err) => {
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

    const user = AuthService.getAuthenticatedUser(res.req);
    if(!user) throw new UnauthorizedException('Usuário não autorizado');
    
    const { name, owner } = createSocialSpaceDto;

    try {
      validateUserInput(createSocialSpaceDto.name, createSocialSpaceDto.owner, res);
      validateUserInputFormat(createSocialSpaceDto.name, createSocialSpaceDto.owner, res)
    } catch (error) {
      this.logger.error('Erro de validação:', error.message);
      throw error;
    }

    const escapedName: string = escapeSpecialCharacters(createSocialSpaceDto.name);
    const escapedOwner: string = escapeSpecialCharacters(createSocialSpaceDto.owner);
    
    // Query parametrizada para evitar SQL Injection
    const query = `INSERT INTO spaces(name, owner) VALUES(?, ?)`;
  
    const stmt = this.db.prepare(query);
  
    try {
      this.db.run("BEGIN TRANSACTION;", (err) => {
        if (err) {
          this.logger.error('Erro ao iniciar a transação: ', err.message);
          res.status(500).json({ error: 'Erro ao iniciar a transação' });
          return;
        }
  
        stmt.run([escapedName, escapedOwner], (err) => {
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

          stmt.finalize();
  
          this.logger.debug(`Comando SQL executado com segurança: ${query}`);
  
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

            this.db.run("COMMIT;", (err) => {
              if (err) {
                this.logger.error('Erro ao finalizar a transação: ', err.message);
                res.status(500).json({ error: 'Erro ao finalizar a transação' });
                return;
              }

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

  async updateSpace(id: number, updateSocialSpace: UpdateSocialSpaceDto) {
    return new Promise((resolve, reject) => {
      // Query para atualizar o espaço
      const { name, owner } = updateSocialSpace;
      const sql = `UPDATE spaces SET name = ?, owner = ? WHERE id = ?`;

      // Executando a query
      this.db.run(sql, [name, owner, id], function (err) {
        if (err) {
          reject(new NotFoundException('Space not found'));
        } else if (this.changes === 0) {
          reject(new NotFoundException('Space not found'));
        } else {
          // Retorna a URI com o ID do espaço atualizado
          resolve({ uri: `http://localhost:3000/spaces/${id}` });
        }
      });
    });
  }
}
