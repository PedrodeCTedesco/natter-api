import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from 'src/token/token.service';
import { TOKEN_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.interface.token.service';
import { TOKEN_STORE } from 'src/token/constants/token.store.constants';
import { CookieTokenStore } from 'src/token/cookie.token.store';
import { AUDIT_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.audit.service';
import { AuditService } from 'src/audit_logging/audit_logging.service';
import { DATABASE_TOKEN } from 'src/interfaces/interfaces.tokens/token.database';
import * as sqlite3 from 'sqlite3';
import { DatabaseProvider } from 'src/config/database/database.provider';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: DATABASE_TOKEN,
      useFactory: DatabaseProvider.useFactory
    },
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
    }
  ],
  exports:[AuthService],
})
export class AuthModule {}
