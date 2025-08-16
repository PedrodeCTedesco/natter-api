import { Controller, Post, Body, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

interface LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const { username, password } = loginDto;

    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    console.log('req.user antes do login:', req['user']);
    
    // Retorna o resultado do AuthService
    return await this.authService.login(req);
  }
}