import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialSpace } from './entities/social-space.entity';
import { CreateSocialSpaceDto } from './dto/create-social-space.dto';

@Injectable()
export class SocialSpacesService {
  constructor(
    @InjectRepository(SocialSpace)
    private readonly socialSpaceRepository: Repository<SocialSpace>,
  ) {}

  async create(createSocialSpaceDto: CreateSocialSpaceDto): Promise<{ uri: string }> {

    const newSpace = this.socialSpaceRepository.create({
      ...createSocialSpaceDto,
      uri: '',
    });

    const savedSpace = await this.socialSpaceRepository.save(newSpace);

    savedSpace.uri = `http://localhost:3000/spaces/${savedSpace.id}`;

    await this.socialSpaceRepository.save(savedSpace);

    return { uri: savedSpace.uri };
  }
}
