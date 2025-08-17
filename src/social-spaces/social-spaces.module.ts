import { Module } from '@nestjs/common';
import { SocialSpacesService } from './social-spaces.service';
import { SocialSpacesController } from './social-spaces.controller';
import { DATABASE_TOKEN } from 'src/interfaces/interfaces.tokens/token.database';
import { DatabaseProvider } from 'src/config/database/database.provider';

@Module({
  controllers: [SocialSpacesController],
  providers: [
    SocialSpacesService,
    {
      provide: DATABASE_TOKEN,
      useFactory: DatabaseProvider.useFactory
    },
  ],
  exports: [SocialSpacesService]
})
export class SocialSpacesModule {}
