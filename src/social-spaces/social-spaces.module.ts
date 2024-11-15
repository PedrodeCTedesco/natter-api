import { Module } from '@nestjs/common';
import { SocialSpacesService } from './social-spaces.service';
import { SocialSpacesController } from './social-spaces.controller';

@Module({
  controllers: [SocialSpacesController],
  providers: [SocialSpacesService],
})
export class SocialSpacesModule {}
