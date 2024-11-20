import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import * as sqlite3 from 'sqlite3';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { AuthService } from '../auth/auth.service';
import { validateSpaceId, validateUserMessage, validateUserMessageFormat, validateDate, validateMessageId, escapeSpecialCharacters } from '../auth/input.validation/input.validation.helper';
import { Logger } from '@nestjs/common';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @Inject('DATABASE') private readonly db: sqlite3.Database,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto, res: Response): Promise<{ id: number }> {
  
    const user = AuthService.getAuthenticatedUser(res.req);
    if (!user) throw new UnauthorizedException('Usuário não autorizado');
  
    try {
      // Validações de entrada
      validateSpaceId(createMessageDto.spaceId, res);
      validateUserMessage(createMessageDto.message, res);
      validateUserMessageFormat(createMessageDto.message, res);

    } catch (error) {
      this.logger.error('Erro de validação:', error.message);
      throw error;
    }
  
    try {

      const escapedMessage: string = escapeSpecialCharacters(createMessageDto.message);
      
      const messageId = await new Promise<number>((resolve, reject) => {
        this.db.run(
          'INSERT INTO messages (author, message, space_id) VALUES (?, ?, ?)',
          [createMessageDto.author, escapedMessage, Number(createMessageDto.spaceId)],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
  
      res.status(201).json({ id: messageId });
      return { id: messageId };
    } catch (error) {
      this.logger.error('Erro ao criar mensagem:', error);
      throw error;
    }
  }
  
  async findMessages(spaceId: number, res: Response, since?: string): Promise<Message[]> {
    
    try {
      validateSpaceId(spaceId, res);
      if (since) {
        validateDate(since);
      }
  
      const query = `
        SELECT * FROM messages
        WHERE space_id = ?
        ${since ? "AND created_at >= datetime(?)" : ""}
      `;
      
      const params: (number | string)[] = [spaceId];
      if (since) {
        params.push(since);
      }
  
      return new Promise((resolve, reject) => {
        this.db.all(query, params, (err, rows: any) => {
          if (err) {
            this.logger.error('Erro na consulta:', err.message);
            reject(err);
            return;
          }
          this.logger.log(`Mensagens recuperadas com sucesso: ${rows.length} registros`);
          resolve(rows);
        });
      });
    } catch (error) {
      this.logger.error('Erro de validação:', error.message);
      throw error;
    }
  }

  async findMessageById(spaceId: number, messageId: number, res: Response): Promise<Message> {

    try {
      validateSpaceId(spaceId, res);
      validateMessageId(messageId, res);
    } catch(error) {
      this.logger.error('Erro de validação:', error.message);
      throw error;
    }

    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM messages
        WHERE space_id = ? AND id = ?
      `;
      const params = [spaceId, messageId];
  
      this.db.get(query, params, (err, row: any) => {
        if (err) {
          console.error('Erro ao buscar mensagem por ID:', err.message);
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('Message not found'));
          return;
        }
  
        resolve(row);
      });
    });
  }
}
