import { Controller, Post, Body, Param, Get, Query, Res, UseGuards, Logger } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Response } from 'express';
import { PermissionGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from 'src/auth/decorators/permissions.decorator';

@Controller('spaces/messages')
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(private readonly messagesService: MessagesService) {}

  @RequirePermission('GET', 'R')
  @UseGuards(PermissionGuard) 
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

  @RequirePermission('GET', 'R')
  @UseGuards(PermissionGuard) 
  @Get(':spaceId/:messageId')
  async readMessage(
    @Param('spaceId') spaceId: number,
    @Param('messageId') messageId: number,
    @Res() res: Response
  ): Promise<void> { // Altere para 'void'
    try {
      const message = await this.messagesService.findMessageById(spaceId, messageId, res);
      res.status(200).json(message); // Envia a mensagem como JSON
    } catch (error) {
      console.error('Erro no controller:', error.message);
      res.status(400).json({ error: error.message }); // Retorna erro
    }
  }

  @RequirePermission('POST', 'RW')
  @UseGuards(PermissionGuard)   
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
