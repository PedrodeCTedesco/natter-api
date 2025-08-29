import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { TokenService } from '../token.service';
import { TOKEN_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.interface.token.service';
import { TokenCleanupService } from './token.cleanup.service';
import { TOKEN_STORE } from '../constants/token.store.constants';
import { DatabaseProvider } from 'src/config/database/database.provider';
import { AUDIT_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.audit.service';
import { AuditService } from 'src/audit_logging/audit_logging.service';
import { USER_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.user.service';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { SOCIAL_SPACE_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.social.space.service';
import { SocialSpacesService } from 'src/social-spaces/social-spaces.service';
import { JsonTokenStore } from '../jwt.token.store';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    ConfigService,
    TokenCleanupService,
    DatabaseProvider,
    {
        provide: AUDIT_SERVICE_TOKEN,
        useClass: AuditService
    },
    {
      provide: USER_SERVICE_TOKEN,
      useClass: UsersService
    },    
    {
      provide: TOKEN_STORE,
      useClass: JsonTokenStore
    },    
    {
      provide: TOKEN_SERVICE_TOKEN,
      useClass: TokenService,
    },
    {
      provide: SOCIAL_SPACE_SERVICE_TOKEN,
      useClass: SocialSpacesService
    },    
  ],
  exports: [TokenCleanupService],
})
export class TokenCleanupModule {}
