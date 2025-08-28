import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { httpsOptions } from './config/https/https.options';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { httpsOptions });
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://127.0.0.1:4000',
      'https://172.23.112.1:4000',
      'https://192.168.15.5:4000',
      'https://localhost:4000'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`App is running on port: ${process.env.PORT ?? 3000}`);
  });
}
bootstrap();