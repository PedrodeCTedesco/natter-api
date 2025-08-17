import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { TOKEN_STORE } from './constants/token.store.constants';
import { CookieTokenStore } from './cookie.token.store';
import { AuditLoggingModule } from 'src/audit_logging/audit_logging.module';
import { AUDIT_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.audit.service';
import { AuditService } from 'src/audit_logging/audit_logging.service';
import { DatabaseProvider } from 'src/config/database/database.provider';
import { USER_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.user.service';
import { UsersService } from 'src/users/users.service';
import { SOCIAL_SPACE_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.social.space.service';
import { SocialSpacesService } from 'src/social-spaces/social-spaces.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [AuditLoggingModule],
  controllers: [TokenController],
  providers: [
    TokenService,
    {
      provide: TOKEN_STORE,
      useClass: CookieTokenStore
    },
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
      provide: SOCIAL_SPACE_SERVICE_TOKEN,
      useClass: SocialSpacesService
    },
    ConfigService
  ],
  exports: [TokenService]
})
export class TokenModule {}