import { Module } from '@nestjs/common';
import { SocialSpacesService } from './social-spaces.service';
import { SocialSpacesController } from './social-spaces.controller';
import { DatabaseModule } from '../config/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SocialSpacesController],
  providers: [SocialSpacesService],
})
export class SocialSpacesModule {}
