import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialSpace } from './entities/social-space.entity';
import { CreateSocialSpaceDto } from './dto/create-social-space.dto';
import { Message } from '../messages/entities/message.entity';
import { Response } from 'express';
import { Logger } from '@nestjs/common';

@Injectable()
export class SocialSpacesService {
  private readonly logger = new Logger(SocialSpacesService.name);

  constructor(
    @InjectRepository(SocialSpace)
    private readonly socialSpaceRepository: Repository<SocialSpace>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>
  ) {}

  /** Versão inicial feita por mim */
  async create(createSocialSpaceDto: CreateSocialSpaceDto, res: Response): Promise<{ uri: string }> {
    this.logger.debug("Método seguro acionado!")
    // Cria o novo espaço social
    const newSpace = this.socialSpaceRepository.create({
      ...createSocialSpaceDto,
      uri: '',
    });

    // Salva o novo espaço no banco de dados
    const savedSpace = await this.socialSpaceRepository.save(newSpace);

    // Atualiza a URI do espaço
    savedSpace.uri = `http://localhost:3000/spaces/${savedSpace.id}`;

    // Salva novamente para garantir que a URI seja persistida
    await this.socialSpaceRepository.save(savedSpace);

    // Configura o cabeçalho Location na resposta HTTP
    res.setHeader('Location', savedSpace.uri);

    // Retorna a URI no corpo da resposta com status 201
    res.status(201).json({ uri: savedSpace.uri });

    return { uri: savedSpace.uri }; // Retorno adicional para garantir compatibilidade
  }

  /** Versão fornecida pelo autor, com vulnerabilidade SQL Injection */
  async createSQLInjectionVulnerability(createSocialSpaceDto: CreateSocialSpaceDto, res: Response): Promise<{ uri: string }> {
    this.logger.debug('Método vulnerável acionado!')
    const { name, owner } = createSocialSpaceDto;

    // Aqui está a vulnerabilidade de SQL Injection, pois estamos concatenando as entradas diretamente na consulta
    await this.socialSpaceRepository.query(
      `INSERT INTO social_space(name, owner) VALUES('${name}', '${owner}');`
    );

    const result = await this.socialSpaceRepository.query(`SELECT last_insert_rowid() as id;`);
    const spaceId = result[0].id;

    const spaceUri = `http://localhost:3000/spaces/${spaceId}`;

    // Configura o cabeçalho Location na resposta HTTP
    res.setHeader('Location', spaceUri);

    // Retorna a URI no corpo da resposta com status 201
    res.status(201).json({ uri: spaceUri });

    return { uri: spaceUri };
  }

  async addMessage(spaceId: string, messageData: { author: string, message: string }) {

    const socialSpace = await this.socialSpaceRepository.findOne({
      where: { id: parseInt(spaceId) }, 
    });
  
    if (!socialSpace) {
      throw new Error('Space not found'); 
    }
  

    const newMessage = this.messageRepository.create({
      author: messageData.author, 
      msg_txt: messageData.message, 
      spaceId: spaceId, 
    });
  
    await this.messageRepository.save(newMessage);
  
    return newMessage;
  }

  async getAllSpaces(): Promise<SocialSpace[]> {
    return this.socialSpaceRepository.find();
  }
}
