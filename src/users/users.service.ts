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
