import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
