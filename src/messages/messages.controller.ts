import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';

@Controller('spaces/:spaceId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

/*   @Get()
  async listMessages(@Param('spaceId') spaceId: string, @Query('since') since: string): Promise<Message[]> {
    return await this.messagesService.findMessages(spaceId, since);
  } */

/*   @Get(':messageId')
  async readMessage(
    @Param('spaceId') spaceId: string,
    @Param('messageId') messageId: number,
  ): Promise<Message> {
    return await this.messagesService.findMessageById(spaceId, messageId);
  } */

/*   @Post()
  async sendMessage(
    @Param('spaceId') spaceId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return await this.messagesService.createMessage(spaceId, createMessageDto);
  } */
}
