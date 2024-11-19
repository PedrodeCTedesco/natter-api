import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as sqlite3 from 'sqlite3';
import { initializeDatabase } from './config/database/database..config';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`App is running on: http://localhost:${process.env.PORT ?? 3000}`);
  });
}
bootstrap();
