import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { TOKEN_STORE } from './constants/token.store.constants';
import { CookieTokenStore } from './cookie.token.store';
import { AuditLoggingModule } from 'src/audit_logging/audit_logging.module';
import { AUDIT_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.audit.service';
import { AuditService } from 'src/audit_logging/audit_logging.service';
import { DatabaseProvider } from 'src/config/database/database.provider';

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
    }
  ],
  exports: [TokenService]
})
export class TokenModule {}