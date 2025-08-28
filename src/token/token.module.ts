import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { TOKEN_STORE } from './constants/token.store.constants';
import { AuditLoggingModule } from 'src/audit_logging/audit_logging.module';
import { AUDIT_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.audit.service';
import { AuditService } from 'src/audit_logging/audit_logging.service';
import { DatabaseProvider } from 'src/config/database/database.provider';
import { USER_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.user.service';
import { UsersService } from 'src/users/users.service';
import { SOCIAL_SPACE_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.social.space.service';
import { SocialSpacesService } from 'src/social-spaces/social-spaces.service';
import { ConfigService } from '@nestjs/config';
import { DatabaseTokenStore } from 'src/token/database.token.store.service';
import { HmacTokenStore } from './hmac.token.store';

@Module({
  imports: [AuditLoggingModule],
  controllers: [TokenController],
  providers: [
    TokenService,
    DatabaseTokenStore,
    {
      provide: TOKEN_STORE,
      useClass:HmacTokenStore
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
    {
      provide: 'HMAC_SECRET',
      useFactory: (configService: ConfigService) => {
        const hmacKey = configService.get<string>('HMAC_SECRET_KEY');
        
        if (!hmacKey) {
          throw new Error(
            'HMAC_SECRET_KEY not found in environment variables. ' +
            'Run: npm run generate:hmac'
          );
        }
        
        if (hmacKey.length < 32) {
          throw new Error('HMAC_SECRET_KEY must be at least 32 characters long');
        }
        
        return hmacKey;
      },
      inject: [ConfigService],
    },    
    ConfigService
  ],
  exports: [TokenService, TOKEN_STORE]
})
export class TokenModule {}