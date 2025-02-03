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
    AuditLoggingModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor
    },
    AppService
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
    .apply(HeaderConfigMiddleware)
    .forRoutes({ path: '*', method: RequestMethod.ALL });
    
    // HeaderAuthMiddleware agora vem ANTES do AuditMiddleware
    consumer
      .apply(HeaderAuthMiddleware)
      .exclude(
        { path: 'users', method: RequestMethod.POST },
        { path: 'static/*', method: RequestMethod.ALL }
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    
    // AuditMiddleware vem depois da autenticação
    consumer
      .apply(AuditMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL});
  }
}