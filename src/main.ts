import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { httpsOptions } from './config/https/https.options';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { httpsOptions });
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`App is running on port: ${process.env.PORT ?? 3000}`);
  });
}
bootstrap();
