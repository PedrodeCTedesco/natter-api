import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SocialSpacesService } from './social-spaces.service';
import { CreateSocialSpaceDto } from './dto/create-social-space.dto';
import { UpdateSocialSpaceDto } from './dto/update-social-space.dto';

@Controller('spaces')
export class SocialSpacesController {
  constructor(private readonly socialSpacesService: SocialSpacesService) {}

  @Get('/:spaceId/messages')
  async getAllMessages(): Promise<any> {

  }

  @Get('/:spaceId/messages/:messageId')
  async getMessage(): Promise<any> {

  }

  @Post()
  async createSpace(@Body() createSocialSpaceDto: CreateSocialSpaceDto) {
    return this.socialSpacesService.create(createSocialSpaceDto);
  }

  @Post('/:spaceId/messages')
  async addMessage(author: string, message: string): Promise<void> {
    
  }
}
