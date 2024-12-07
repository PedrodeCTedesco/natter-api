import { Inject, Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import * as sqlite3 from 'sqlite3';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { AuthService } from '../auth/auth.service';
import { 
  validateSpaceId, 
  validateUserMessage, 
  validateUserMessageFormat, 
  validateDate, 
  validateMessageId, 
  escapeSpecialCharacters 
} from '../auth/input.validation/input.validation.helper';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @Inject('DATABASE') private readonly db: sqlite3.Database,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto, res: Response): Promise<{ 
    id: number, 
    messageInfo: {
        author: string,
        message: string, 
        space: number,
    },
    user: string,
    permissions: string
  }> {
      const user = AuthService.getAuthenticatedUser(res.req);
      if (!user) {
          this.logger.error('Usuário não autorizado.');
          res.status(401).json({ message: 'Usuário não autorizado' });
          return;
      }

      try {
          // Validações de entrada
          validateSpaceId(createMessageDto.spaceId, res);
          validateUserMessage(createMessageDto.message, res);
          validateUserMessageFormat(createMessageDto.message, res);
      } catch (error) {
          this.logger.error('Erro de validação:', error.message);
          res.status(400).json({ message: 'Erro de validação', details: error.message });
          return;
      }

      try {
          // Verifica se o spaceId existe no banco de dados
          const spaceExists = await new Promise<boolean>((resolve, reject) => {
              this.db.get(
                  'SELECT COUNT(1) as count FROM spaces WHERE id = ?',
                  [createMessageDto.spaceId],
                  (err, row: any) => {
                      if (err) {
                          reject(err);
                      } else {
                          resolve(row.count > 0);
                      }
                  }
              );
          });

          if (!spaceExists) {
              this.logger.error(`SpaceId ${createMessageDto.spaceId} não encontrado.`);
              res.status(404).json({ message: `O espaço com ID ${createMessageDto.spaceId} não foi encontrado.` });
              return;
          }

          // Escapa os caracteres especiais na mensagem
          const escapedMessage: string = escapeSpecialCharacters(createMessageDto.message);

          // Insere a mensagem no banco de dados
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

          // Consulta as permissões do usuário para o spaceId
          const permissions = await new Promise<string>((resolve, reject) => {
              this.db.get(
                  'SELECT perms FROM permissions WHERE space_id = ? AND user_id = ?',
                  [createMessageDto.spaceId, user.user_id],
                  (err, row: any) => {
                      if (err) {
                          reject(err);
                      } else if (row) {
                          resolve(row.perms);  // Exemplo de retorno de permissões (pode ser 'read', 'write', etc.)
                      } else {
                          resolve('none');  // Caso não haja permissões, retornamos 'none'
                      }
                  }
              );
          });

          // Retorna a resposta com as informações necessárias
          res.status(201).json({ 
              id: messageId, 
              messageInfo: {
                  author: createMessageDto.author,
                  message: escapedMessage, 
                  space: createMessageDto.spaceId,
              },
              user: user.user_id,
              permissions: permissions
          });

          return { 
              id: messageId, 
              messageInfo: {
                  author: createMessageDto.author,
                  message: escapedMessage, 
                  space: createMessageDto.spaceId,
              },
              user: user.user_id,
              permissions: permissions
          };
      } catch (error) {
          this.logger.error('Erro ao criar mensagem:', error.message);
          res.status(500).json({ message: 'Erro ao criar mensagem', details: error.message });
          return;
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
      // Validações que utilizam o objeto 'res'
      validateSpaceId(spaceId, res);
      validateMessageId(messageId, res);
  
      // Promessa para consultar o banco de dados
      return new Promise((resolve, reject) => {
        const query = `
          SELECT * FROM messages
          WHERE space_id = ? AND id = ?
        `;
        const params = [spaceId, messageId];
  
        this.db.get(query, params, (err, row: any) => {
          if (err) {
            console.error('Erro ao buscar mensagem por ID:', err.message);
            reject(new Error('Erro interno no banco de dados')); // Gera erro interno
            return;
          }
  
          if (!row) {
            console.error('Mensagem não encontrada para spaceId:', spaceId, 'messageId:', messageId);
            reject(new Error('Mensagem não encontrada')); // Gera erro de "não encontrado"
            return;
          }
  
          resolve(row); // Retorna a mensagem encontrada
        });
      });
    } catch (error) {
      console.error('Erro de validação ou processamento:', error.message);
      throw error; // Relança o erro para ser tratado no controller
    }
  }
  
}
