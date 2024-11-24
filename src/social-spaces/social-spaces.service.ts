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
  async create(createSocialSpaceDto: CreateSocialSpaceDto, res: Response): Promise<{ 
    uri: string, 
    name: string,
    owner: string,
    userSpaceInfo: {
      user: string,
      permissions: string
    }
  }> {
    this.logger.debug('Método seguro acionado');
  
    const user = AuthService.getAuthenticatedUser(res.req);
    if (!user) throw new UnauthorizedException('Usuário não autorizado');
  
    try {
      validateUserInput(createSocialSpaceDto.name, createSocialSpaceDto.owner, res);
      validateUserInputFormat(createSocialSpaceDto.name, createSocialSpaceDto.owner, res);
    } catch (error) {
      this.logger.error('Erro de validação:', error.message);
      throw error;
    }
  
    try {
      const escapedName: string = escapeSpecialCharacters(createSocialSpaceDto.name);
      const escapedOwner: string = escapeSpecialCharacters(createSocialSpaceDto.owner);
  
      // Inserir o espaço na tabela "spaces"
      const spaceId = await new Promise<number>((resolve, reject) => {
        this.db.run(
          'INSERT INTO spaces (name, owner) VALUES (?, ?)',
          [escapedName, escapedOwner],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
  
      const spaceUri = `http://localhost:3000/spaces/${spaceId}`;
  
      // Atualizar a URI do espaço
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
  
      // Adicionar permissões "rwd" para o criador do espaço
      await new Promise<void>((resolve, reject) => {
        this.db.run(
          'INSERT INTO permissions (space_id, user_id, perms) VALUES (?, ?, ?)',
          [spaceId, user.id, 'rwd'], // 'rwd' representa todas as permissões
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
  
      res.status(201)
        .header('Location', spaceUri)
        .json({ 
          uri: spaceUri,
          name: escapedName,
          owner: escapedOwner,
          userSpaceInfo: {
            user: user.user_id,
            permissions: "rwd"
          }
        });
  
      return { 
        uri: spaceUri,
        name: escapedName,
        owner: escapedOwner,
        userSpaceInfo: {
          user: user.user_id,
          permissions: "rwd"
        }
      };
  
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
  async createSQLInjectionVulnerabilityWithSolution(createSocialSpaceDto: CreateSocialSpaceDto, res: Response): Promise<{
    uri: string;
    name: string;
    owner: string;
    userSpaceInfo: {
      user: string,
      permissions: string
    }
  }> {
    this.logger.debug('Método seguro acionado');
  
    const user = AuthService.getAuthenticatedUser(res.req);
    if (!user) throw new UnauthorizedException('Usuário não autorizado');
  
    try {
      validateUserInput(createSocialSpaceDto.name, createSocialSpaceDto.owner, res);
      validateUserInputFormat(createSocialSpaceDto.name, createSocialSpaceDto.owner, res);
    } catch (error) {
      this.logger.error('Erro de validação:', error.message);
      throw error;
    }
  
    const escapedName: string = escapeSpecialCharacters(createSocialSpaceDto.name);
    const escapedOwner: string = escapeSpecialCharacters(createSocialSpaceDto.owner);
  
    try {
      await new Promise<void>((resolve, reject) => {
        this.db.run("BEGIN TRANSACTION;", (err) => {
          if (err) {
            this.logger.error('Erro ao iniciar a transação: ', err.message);
            reject(new Error('Erro ao iniciar a transação'));
          }
          resolve();
        });
      });
  
      const spaceId = await new Promise<number>((resolve, reject) => {
        this.db.run(
          'INSERT INTO spaces (name, owner) VALUES (?, ?)',
          [escapedName, escapedOwner],
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.lastID);
            }
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
  
      await new Promise<void>((resolve, reject) => {
        this.db.run(
          'INSERT INTO permissions (space_id, user_id, perms) VALUES (?, ?, ?)',
          [spaceId, user.id, 'rwd'],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
  
      await new Promise<void>((resolve, reject) => {
        this.db.run("COMMIT;", (err) => {
          if (err) {
            this.logger.error('Erro ao finalizar a transação: ', err.message);
            reject(new Error('Erro ao finalizar a transação'));
          }
          resolve();
        });
      });
  
      res.status(201)
        .header('Location', spaceUri)
        .json({
          uri: spaceUri,
          name: escapedName,
          owner: escapedOwner,
          userSpaceInfo: {
            user: user.user_id,
            permissions: "rwd"
          }
        });
  
      return {
        uri: spaceUri,
        name: escapedName,
        owner: escapedOwner,
        userSpaceInfo: {
          user: user.user_id,
          permissions: "rwd"
        }
      };
    } catch (error) {
      this.logger.error('Erro ao criar espaço:', error.message);
  
      await new Promise<void>((resolve) => {
        this.db.run("ROLLBACK;", (rollbackErr) => {
          if (rollbackErr) {
            this.logger.error('Erro ao reverter a transação: ', rollbackErr.message);
          }
          resolve();
        });
      });
  
      res.status(500).json({ error: 'Erro ao criar espaço' });
      throw error;
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

  async addMember(spaceId: number, username: string, permissions: string): Promise<{ username: string; permissions: string }> {
    this.logger.debug(`Adicionando membro ao espaço ${spaceId}: usuário ${username} com permissões ${permissions}`);
    
    // Verifica se as permissões são válidas
    if (!permissions.match(/^r?w?d?$/)) throw new Error('Permissões inválidas. Use combinações de "r", "w", "d".');

    // Adiciona o membro no banco de dados
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO permissions (space_id, user_id, perms) VALUES (?, ?, ?)`,
        [spaceId, username, permissions],
        (err) => {
          if (err) {
            this.logger.error(`Erro ao adicionar membro: ${err.message}`);
            reject(new Error('Erro ao adicionar membro ao espaço'));
          } else {
            resolve({ username, permissions });
          }
        },
      );
    });
  }
  
}
