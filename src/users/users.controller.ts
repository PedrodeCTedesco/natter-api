import { Controller, Post, Body, BadRequestException, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      // Se quiser manter as validações no controller
      const regexUsername = /^[a-zA-Z0-9\s]*$/; 
      if (!regexUsername.test(createUserDto.username)) {
        throw new BadRequestException('O valor fornecido contém caracteres especiais não permitidos.');
      }

      const regexPassword = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      if (!regexPassword.test(createUserDto.password)) {
        throw new BadRequestException('O valor fornecido deve conter ao menos 1 letra maiúscula, 8 caracateres e caracteres especiais.');
      }

      // Aguarda a resposta do service
      const result = await this.usersService.create(createUserDto);
      return result;
    } catch (error) {
      console.log('Erro no controller:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        status: 400,
        message: error.message || 'Erro ao criar usuário'
      });
    }
  }

  @Get()
  async getAllUsers() {
    try {
      return await this.usersService.getUsers();
    } catch (err) {
      throw new BadRequestException('Erro ao recuperar usuários');
    }
  }
}
