import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from 'src/token/token.service';
import { TOKEN_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.interface.token.service';
import { TOKEN_STORE } from 'src/token/constants/token.store.constants';
import { CookieTokenStore } from 'src/token/cookie.token.store';
import { AUDIT_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.audit.service';
import { AuditService } from 'src/audit_logging/audit_logging.service';
import { DatabaseProvider } from 'src/config/database/database.provider';
import { USER_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.user.service';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { SOCIAL_SPACE_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.social.space.service';
import { SocialSpacesService } from 'src/social-spaces/social-spaces.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    DatabaseProvider,
    {
      provide: AUDIT_SERVICE_TOKEN,
      useClass: AuditService
    },
    {
      provide: TOKEN_STORE,
      useClass: CookieTokenStore
    },    
    {
      provide: TOKEN_SERVICE_TOKEN,
      useClass: TokenService
    },
    {
      provide: USER_SERVICE_TOKEN,
      useClass: UsersService
    },
    ConfigService,
    {
      provide: SOCIAL_SPACE_SERVICE_TOKEN,
      useClass: SocialSpacesService
    }
  ],
  exports:[AuthService],
})
export class AuthModule {}
