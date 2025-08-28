import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TOKEN_SERVICE_TOKEN } from 'src/interfaces/interfaces.tokens/token.interface.token.service';
import { TokenService } from '../token.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    @Inject(TOKEN_SERVICE_TOKEN) private readonly tokenService: TokenService
) {}

  @Cron('*/5 * * * *')
  async handleCron() {
    try {
      await this.tokenService.deleteExpiredTokens();
      this.logger.log('Expired tokens removed successfully');
    } catch (err) {
      this.logger.error('Error deleting expired tokens', err);
    }
  }
}
