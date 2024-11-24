import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from "bcrypt";
import { ConfigService } from '@nestjs/config';
import * as sqlite3 from 'sqlite3';
import { User } from './interfaces/user.interface';

@Injectable()
export class UsersService {

  constructor(
    private readonly configService: ConfigService,
    @Inject('DATABASE') private readonly db: sqlite3.Database,
  ) {}
  
  async create(createUserDto: CreateUserDto) {
    const { username, password } = createUserDto;
  
    try {
      const salt = await bcrypt.genSalt(
        parseInt(this.configService.get('SALT') || "10")
      );
      const hash = await bcrypt.hash(password, salt);
  
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
  
      return { 
        username: username,
        created: true 
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('User creation failed');
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
