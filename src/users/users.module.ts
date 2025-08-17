import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../config/database/database.module';
import { SocialSpacesModule } from 'src/social-spaces/social-spaces.module';
import { DatabaseProvider } from 'src/config/database/database.provider';
import { SOCIAL_SPACE_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.social.space.service';
import { SocialSpacesService } from 'src/social-spaces/social-spaces.service';

@Module({
  imports:[ConfigModule, DatabaseModule, SocialSpacesModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    DatabaseProvider,
    {
      provide: SOCIAL_SPACE_SERVICE_TOKEN,
      useClass: SocialSpacesService
    }
  ],
  exports: [UsersService]
})
export class UsersModule {}
