import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { TOKEN_STORE } from './constants/token.store.constants';
import { CookieTokenStore } from './cookie.token.store';
import { AuditLoggingModule } from 'src/audit_logging/audit_logging.module';

@Module({
  imports: [AuditLoggingModule],
  controllers: [TokenController],
  providers: [
    TokenService,
    {
      provide: TOKEN_STORE,
      useClass: CookieTokenStore
    }
  ],
  exports: [TokenService]
})
export class TokenModule {}