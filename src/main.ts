import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const dataSource = app.get(DataSource);
  
  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`App is running on: http://localhost:${process.env.PORT ?? 3000}`);
    console.log(`Database type: ${dataSource.options.type}`);
    console.log(`Database name: ${dataSource.options.database}`);
  });
}
bootstrap();
