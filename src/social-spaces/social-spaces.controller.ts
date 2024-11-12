import { Controller, Get, Post, Body, Param, Res } from '@nestjs/common';
import { SocialSpacesService } from './social-spaces.service';
import { CreateSocialSpaceDto } from './dto/create-social-space.dto';
import { Response } from 'express';

@Controller('spaces')
export class SocialSpacesController {
  constructor(private readonly socialSpacesService: SocialSpacesService) {}

  @Post()
  async createSpace(
    @Body() createSocialSpaceDto: CreateSocialSpaceDto,
    @Res() res: Response,
  ) {
    return this.socialSpacesService.create(createSocialSpaceDto, res);
  }

  @Post('/:spaceId/messages')
  async addMessage(
    @Param('spaceId') spaceId: string,
    @Body() messageData: { author: string, message: string }, 
  ) {

    return this.socialSpacesService.addMessage(spaceId, messageData);
  }
}
