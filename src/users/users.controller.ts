import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {

    const regexUsername = /^[a-zA-Z0-9\s]*$/; 
    if (!regexUsername.test(createUserDto.username)) throw new BadRequestException('O valor fornecido contém caracteres especiais não permitidos.');

    const regexPassword = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!regexPassword.test(createUserDto.password)) throw new BadRequestException('O valor fornecido deve conter ao menos 1 letra maiúscula, 8 caracateres e caracteres especiais.');

    return this.usersService.create(createUserDto);
  }
}
