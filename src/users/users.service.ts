import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from "bcrypt";
import { ConfigService } from '@nestjs/config';
import * as sqlite3 from 'sqlite3';
import { User } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('DATABASE') private readonly db: sqlite3.Database,
  ) {}
  
  async create(createUserDto: CreateUserDto) {
    const { username, password, permissions = '' } = createUserDto;
  
    try {
      const salt = await bcrypt.genSalt(
        parseInt(this.configService.get('SALT') || "10")
      );
      const hash = await bcrypt.hash(password, salt);
  
      // Insere na tabela `users`
      try {
        await new Promise((resolve, reject) => {
          this.db.run(
            `INSERT INTO users (user_id, pw_hash) VALUES (?, ?)`, 
            [username, hash], 
            (err) => {
              if (err) reject(err);
              else resolve(true);
            }
          );
        });
      } catch (error) {
        if (error.message) { 
          this.logger.error(`Duplicate username detected: ${username}`);
          throw new BadRequestException({ status: 400, message: 'User with this username already exists'});
        }
        throw error;
      }
  
      if (permissions === 'a') {
        await new Promise((resolve, reject) => {
          this.db.run(
            `INSERT INTO permissions (space_id, user_id, perms) 
             SELECT id, ?, ? 
             FROM spaces`, 
            [username, 'a'],
            (err) => {
              if (err) reject(err);
              else resolve(true);
            }
          );
        });
      }
  
      return { 
        username: username,
        created: true 
      };
    } catch (error) {
      if (error.message) { 
        this.logger.error(`Duplicate username detected: ${username}`);
        throw new BadRequestException({
          status: 400,
          message: 'User with this username already exists',
        });
      }
      throw error;
    }
  }

  async getUsers(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Consulta para obter os usuários com as permissões associadas
      const query = `
        SELECT u.user_id, p.space_id, p.perms
        FROM users u
        LEFT JOIN permissions p ON u.user_id = p.user_id
      `;
      
      this.db.all(query, (err, rows: any) => {
        if (err) {
          reject(err);
          return;
        }

        // Organiza a resposta, agrupando permissões por usuário
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

  async validateBasicAuth(username: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get<User>(
        `SELECT user_id, pw_hash FROM users WHERE user_id = ?`, 
        [username],
        (err, row) => {
          if (err) {
            console.error('Database query error:', err);
            return reject(null);
          }
          
          if (!row) {
            return resolve(null);
          }

          resolve({
            user_id: row.user_id,
            pw_hash: row.pw_hash
          });
        }
      );
    });
  }
}
