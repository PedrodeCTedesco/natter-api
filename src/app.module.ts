import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocialSpacesModule } from './social-spaces/social-spaces.module';
import { MessagesModule } from './messages/messages.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottleLoggerMiddleware } from './middleware/rate.limiting.middleware';
import { HeaderConfigMiddleware } from './middleware/header.config.middleware';
import { additionalSecurityHeaders, helmetConfig } from './config/helmet/helmet';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,
      limit: 3
    },
    {
      name: 'medium',
      ttl: 10000,
      limit: 20,  
    },
    {
      name: 'long',
      ttl: 60000,
      limit: 100 
    }]),
    SocialSpacesModule,
    MessagesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    AppService
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        helmetConfig,
        additionalSecurityHeaders,
        ThrottleLoggerMiddleware, 
        HeaderConfigMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
