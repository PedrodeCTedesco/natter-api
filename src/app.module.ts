import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocialSpacesModule } from './social-spaces/social-spaces.module';
import { MessagesModule } from './messages/messages.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottleLoggerMiddleware } from './middleware/rate_limiting/rate.limiting.middleware';
import { HeaderConfigMiddleware } from './middleware/headers/header.config.middleware';
import { additionalSecurityHeaders, helmetConfig } from './config/helmet/helmet';
import { UsersModule } from './users/users.module';
import { HeaderAuthMiddleware } from './middleware/headers/header.auth.middleware';
import { DatabaseModule } from './config/database/database.module';
import { AuditLoggingModule } from './audit_logging/audit_logging.module';
import { AuditInterceptor } from './interceptor/audit.logging.interceptor';
import { AuditMiddleware } from './middleware/audit_logging/audit.logging.middleware';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TokenModule } from './token/token.module';
import { BasicAuthMiddleware } from './middleware/basic.auth/basic.auth.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenCleanupService } from './token/services/token.cleanup.service';
import { TokenCleanupModule } from './token/services/token.cleanup.module';
import { TOKEN_SERVICE_TOKEN } from './interfaces/interfaces.tokens/token.interface.token.service';
import { TokenService } from './token/token.service';
import { AUDIT_SERVICE_TOKEN } from './interfaces/interfaces.tokens/token.audit.service';
import { AuditService } from './audit_logging/audit_logging.service';
import { USER_SERVICE_TOKEN } from './interfaces/interfaces.tokens/token.user.service';
import { UsersService } from './users/users.service';
import { ConfigService } from '@nestjs/config';
import { SOCIAL_SPACE_SERVICE_TOKEN } from './interfaces/interfaces.tokens/token.social.space.service';
import { SocialSpacesService } from './social-spaces/social-spaces.service';


@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
      serveStaticOptions: {
        index: 'index.html',
        extensions: ['html'],
        setHeaders: (res, path) => {
          const contentTypeMap: Record<string, string> = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.ico': 'image/x-icon',
          };
        
          const ext = path.substring(path.lastIndexOf('.'));
          if (contentTypeMap[ext]) {
            res.setHeader('Content-Type', contentTypeMap[ext]);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
        }
      },
    }),
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
    DatabaseModule,
    SocialSpacesModule,
    MessagesModule,
    AuthModule,
    UsersModule,
    AuditLoggingModule,
    TokenModule,
    TokenCleanupModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [
    ConfigService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: TOKEN_SERVICE_TOKEN,
      useExisting: TokenService
    },
    {
      provide: AUDIT_SERVICE_TOKEN,
      useClass: AuditService
    },
    {
      provide: USER_SERVICE_TOKEN,
      useClass: UsersService
    },         
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor
    },
    {
      provide: SOCIAL_SPACE_SERVICE_TOKEN,
      useClass: SocialSpacesService
    },    
    AppService,
    TokenCleanupService
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ThrottleLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    
    consumer
      .apply(helmetConfig)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    
    consumer  
      .apply(additionalSecurityHeaders)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    consumer
      .apply(BasicAuthMiddleware)
      .forRoutes({ path: 'auth/login', method: RequestMethod.POST });      

    consumer
    .apply(HeaderConfigMiddleware)
    .forRoutes({ path: '*', method: RequestMethod.ALL });
    
    consumer
      .apply(HeaderAuthMiddleware)
      .exclude(
        { path: 'static/*', method: RequestMethod.ALL },
        { path: 'auth/login', method: RequestMethod.POST}
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    
    consumer
      .apply(AuditMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL});
  }
}