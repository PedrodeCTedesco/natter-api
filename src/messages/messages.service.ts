import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async createMessage(spaceId: string, createMessageDto: CreateMessageDto): Promise<Message> {
    const newMessage = this.messageRepository.create({
      ...createMessageDto,
      spaceId,
    });
    return await this.messageRepository.save(newMessage);
  }

  async findMessages(spaceId: string, since?: string): Promise<Message[]> {
    const queryBuilder = this.messageRepository.createQueryBuilder('message');
    queryBuilder.where('message.spaceId = :spaceId', { spaceId });
    if (since) queryBuilder.andWhere('message.msg_time >= :since', { since: new Date(since) });
    return await queryBuilder.getMany();
  }

  async findMessageById(spaceId: string, messageId: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: {
        spaceId,
        msgId: messageId,
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    return message;
  }
}
