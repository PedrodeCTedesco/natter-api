import { Controller, Post, Body, Param, Get, Query, Res } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { Response } from 'express';
import { Logger } from '@nestjs/common';

@Controller('spaces/:spaceId/messages')
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async listMessages(
    @Param('spaceId') spaceId: number, 
    @Query('since') since: string,
    @Res() res: Response
  ) {
    try {
      const messages = await this.messagesService.findMessages(spaceId, res, since);
      this.logger.log('Retornando mensagens para o cliente');
      return res.status(200).json(messages);
    } catch (error) {
      if (error.message.includes('ValidationError')) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno ao buscar mensagens' });
    }
  }

  @Get(':messageId')
  async readMessage(
    @Param('spaceId') spaceId: number,
    @Param('messageId') messageId: number,
    @Res() res: Response
  ): Promise<Message> {
    return await this.messagesService.findMessageById(spaceId, messageId, res);
  }

  @Post()
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Res() res: Response
  ) {
    try {
      return await this.messagesService.createMessage(createMessageDto, res);
    } catch(error) {
      throw error;
    }
  }
}
