import { Controller, Get, Post, Body, Param, Res } from '@nestjs/common';
import { SocialSpacesService } from './social-spaces.service';
import { CreateSocialSpaceDto } from './dto/create-social-space.dto';
import { Response } from 'express';
import { SocialSpace } from './entities/social-space.entity';
import { Logger } from '@nestjs/common';

@Controller('spaces')
export class SocialSpacesController {
  private readonly logger = new Logger(SocialSpacesController.name);
  constructor(private readonly socialSpacesService: SocialSpacesService) {}

  @Post()
  async createSpace(
    @Body() createSocialSpaceDto: CreateSocialSpaceDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Rota com método seguro acionada`);
    return this.socialSpacesService.create(createSocialSpaceDto, res);
  }

  @Post('unsafe')
  async createSpaceSQLInjection(
    @Body() createSocialSpaceDto: CreateSocialSpaceDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Rota com método vulnerável acionado`);
    return this.socialSpacesService.createSQLInjectionVulnerability(createSocialSpaceDto, res);
  }

  @Post('/:spaceId/messages')
  async addMessage(
    @Param('spaceId') spaceId: string,
    @Body() messageData: { author: string, message: string }, 
  ) {

    return this.socialSpacesService.addMessage(spaceId, messageData);
  }

  @Get()
  async spaces(): Promise<SocialSpace[]> {
    return this.socialSpacesService.getAllSpaces();
  }
}
