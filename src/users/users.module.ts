import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../config/database/database.module';
import { SocialSpacesModule } from 'src/social-spaces/social-spaces.module';

@Module({
  imports:[ConfigModule, DatabaseModule, SocialSpacesModule],
  controllers: [UsersController],
  providers: [
    UsersService,
  ],
  exports: [UsersService]
})
export class UsersModule {}
