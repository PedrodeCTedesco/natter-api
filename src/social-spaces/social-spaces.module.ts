import { Module } from '@nestjs/common';
import { SocialSpacesService } from './social-spaces.service';
import { SocialSpacesController } from './social-spaces.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialSpace } from './entities/social-space.entity';
import { Message } from '../messages/entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialSpace, Message])
  ],
  controllers: [SocialSpacesController],
  providers: [SocialSpacesService],
})
export class SocialSpacesModule {}
