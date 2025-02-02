import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from "bcrypt";
import { ConfigService } from '@nestjs/config';
import * as sqlite3 from 'sqlite3';
import { SavedUser, User, UserDB } from './interfaces/user.interface';
import { validatePassword, validatePermissions, validateUsername } from '../auth/input.validation/input.validation.helper';
import { USER_METHODS } from './constants/identifiers.methods';
import { SocialSpacesService } from 'src/social-spaces/social-spaces.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('DATABASE') private readonly db: sqlite3.Database,
    @Inject(SocialSpacesService) private readonly socialSpaceService: SocialSpacesService
  ) {}
  
  async [USER_METHODS.CREATE](createUserDto: CreateUserDto): Promise<SavedUser> {
    const { username, password, spaceId, permissions = '' } = createUserDto;
    validatePassword(password);
    validatePermissions(permissions);
    validateUsername(username);
    
    console.log('Iniciando criação de usuário com dados:', { 
      username, 
      spaceId, 
      permissions 
    });
  
    // Verificar se o espaço existe antes de qualquer outra operação
    if (!spaceId && permissions === 'a') {
      throw new BadRequestException({
        status: 400,
        message: 'spaceId é obrigatório para usuários com permissões de administrador'
      });
    }
  
    if (spaceId) {
      try {
        console.log('Verificando espaço:', spaceId);
        const space = await this.socialSpaceService.findOne(spaceId);
        console.log('Resultado da verificação do espaço:', space);
        
        if (!space) {
          console.log('Espaço não encontrado');
          throw new BadRequestException({
            status: 400,
            message: 'Espaço inexistente'
          });
        }
      } catch (err) {
        console.log('Erro ao verificar espaço:', err);
        if (err instanceof BadRequestException) {
          throw err;
        }
        throw new BadRequestException({
          status: 400,
          message: err.message || 'Erro ao verificar espaço'
        });
      }
    }
  
    try {
      const salt: string = await bcrypt.genSalt(
        parseInt(this.configService.get('SALT') || "10")
      );
      const hash: string = await bcrypt.hash(password, salt);
  
      // Inserir usuário
      await new Promise<void>((resolve, reject) => {
        console.log('Inserindo usuário:', username);
        this.db.run(
          `INSERT INTO users (user_id, pw_hash) VALUES (?, ?)`, 
          [username, hash], 
          (err) => {
            if (err) {
              console.log('Erro ao inserir usuário:', err);
              if (err.message.includes('UNIQUE constraint failed')) {
                return reject(new BadRequestException({
                  status: 400,
                  message: 'User with this username already exists'
                }));
              }
              return reject(err);
            }
            resolve();
          }
        );
      });
  
      // Tratar permissões de administrador
      if (permissions === 'a') {
        await new Promise<void>((resolve, reject) => {
          console.log('Inserindo permissões para:', username);
          this.db.run(
            `INSERT INTO permissions (user_id, space_id, perms) VALUES (?, ?, ?)`, 
            [username, spaceId, permissions],
            (err) => {
              if (err) {
                console.log('Erro ao inserir permissões:', err);
                return reject(err);
              }
              resolve();
            }
          );
        });
      }
  
      console.log('Usuário criado com sucesso:', username);
      return { 
        username: username,
        created: true 
      };
    } catch (error) {
      console.log('Erro no processo de criação:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        status: 400,
        message: error.message || 'Erro ao criar usuário'
      });
    }
  }

  async [USER_METHODS.FIND_ALL](): Promise<User[]> {
    return new Promise((resolve, reject) => {
      const query: string = `
        SELECT u.user_id, p.space_id, p.perms
        FROM users u
        LEFT JOIN permissions p ON u.user_id = p.user_id
      `;
      
      this.db.all(query, (err, rows: any) => {
        if (err) {
          reject(err);
          return;
        }

        const usersWithPermissions = rows.reduce((acc, row) => {
          const user = acc.find(u => u.user_id === row.user_id);
          
          if (!user) {
            acc.push({
              user_id: row.user_id,
              permissions: [
                { space_id: row.space_id, perms: row.perms }
              ]
            });
          } else {
            user.permissions.push({
              space_id: row.space_id,
              perms: row.perms
            });
          }

          return acc;
        }, []);

        resolve(usersWithPermissions);
      });
    });
  }

  async [USER_METHODS.VALIDATION](username: string): Promise<UserDB | null> {
    return new Promise((resolve, reject) => {
      this.db.get<UserDB>(
        `SELECT user_id, pw_hash, permissions FROM users WHERE user_id = ?`, 
        [username],
        (err, row) => {
          if (err) {
            return reject(
              new Error(`Database query error: ${err.message}`,)
            );
          }
          
          if (!row) return resolve(null);

          resolve({
            user_id: row.user_id,
            permissions: row.permissions,
            pw_hash: row.pw_hash
          });
        }
      );
    });
  }
}
