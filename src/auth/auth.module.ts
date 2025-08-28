import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from 'src/token/token.service';
import { TOKEN_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.interface.token.service';
import { TOKEN_STORE } from 'src/token/constants/token.store.constants';
import { AUDIT_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.audit.service';
import { AuditService } from 'src/audit_logging/audit_logging.service';
import { DatabaseProvider } from 'src/config/database/database.provider';
import { USER_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.user.service';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { SOCIAL_SPACE_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.social.space.service';
import { SocialSpacesService } from 'src/social-spaces/social-spaces.service';
import { DatabaseTokenStore } from 'src/token/database.token.store.service';
import { HmacTokenStore } from 'src/token/hmac.token.store';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    DatabaseTokenStore,
    DatabaseProvider,
    {
      provide: AUDIT_SERVICE_TOKEN,
      useClass: AuditService
    },
    {
      provide: TOKEN_STORE,
      useClass: HmacTokenStore
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
    },
    {
      provide: 'HMAC_SECRET',
      useFactory: (configService: ConfigService) => {
        const hmacKey = configService.get<string>('HMAC_SECRET_KEY');
        if (!hmacKey) {
          throw new Error('HMAC_SECRET_KEY not found in environment variables.');
        }
        if (hmacKey.length < 32) {
          throw new Error('HMAC_SECRET_KEY must be at least 32 characters long');
        }
        return hmacKey;
      },
      inject: [ConfigService],
}    
  ],
  exports:[AuthService],
})
export class AuthModule {}
