import { UsersService } from './users.service';
import { setupTest } from '../../test/setuo/setup'
import { BadRequestException, INestApplication } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import * as bcrypt from "bcrypt";
import { SavedUser } from './interfaces/user.interface';
import exp from 'constants';

describe('UsersService', () => {
  let service: UsersService;
  let app: INestApplication;
  let configService: ConfigService;

  beforeEach(async () => {
    const module = await setupTest('Users')

    service = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
    app = module.createNestApplication();
    await app.init();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create method', () => {
    describe('sucess', () => {
      it('should create a new user successfully without permissions', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('USERNAME'),
          password: configService.get<string>('PASSWORD'),
        };
        // Act
        const result = await service.create(createUserDto);
        // Assert
        expect(result).toEqual({
          username: createUserDto.username,
          created: true,
        });
      });
  
      it('should create a user with admin permissions', async () => {
        // Arrange
        const createUserDto = {
          username: configService.get<string>('USERNAME'),
          password: configService.get<string>('PASSWORD'),
          permissions: configService.get<string>('ADMIN')
        };
        // Act
        const result = await service.create(createUserDto);
        // Assert
        expect(result).toEqual({
          username: createUserDto.username,
          created: true,
        });
        
        const users: User[] = await service.getUsers(); 
        const adminUser: User = users.find(u => u.user_id === createUserDto.username);
      
        expect(adminUser.permissions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ perms: createUserDto.permissions })
          ])
        );
      });
    });

    describe('error scenarios', () => {
      it('should throw error when creating duplicate user', async () => {
        // Arrange
        const createUserDto = {
          username: configService.get<string>('DUPLICATED_USERNAME'),
          password: configService.get<string>('PASSWORD'),
        };
      
        // Act, Assert
        const result = await service.create(createUserDto);
        expect(result).toEqual({
          username: createUserDto.username,
          created: true,
        });
      
        // Act
        await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);

        // Assert
        try {
          await service.create(createUserDto);
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'User with this username already exists',
          });
        }
      });
    });

    describe('input validation', () => {
      it('should validate username is not empty', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: '',
          password: configService.get<string>('PASSWORD')
        };
        
        // Act, Assert
        await expect(service.create(createUserDto)).rejects.toThrow();
      });

      it('should validate password meets minimum requirements', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('USERNAME'),
          password: configService.get<string>('INVALID_PASSWORD_LENGTH')
        };
        // Act, Assert
        try {
          expect(service.create(createUserDto));
        } catch(error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'o campo "password" não pode estar vazio, ou ter menos do que 8 caracteres.'
          })
        }
      });

      it('should validate password format', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('USERNAME'),
          password: configService.get<string>('INVALID_PASSWORD_FORMAT')
        };
        // Act, Assert
        try {
          expect(service.create(createUserDto));
        } catch(error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'A senha deve conter pelo menos um número e um caractere especial.'
          })
        }
      });

      it('should validate permissions have valid values', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('USERNAME'),
          password: configService.get<string>('PASSWORD'),
          permissions: configService.get<string>('INVALID_PERMISSION_TYPE')
        };

        // Act, Assert
        try {
          expect(service.create(createUserDto));
        } catch(error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'A permissão não está no formato adequado'
          });
        }
      });

      it('should validate permissions length', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('USERNAME'),
          password: configService.get<string>('PASSWORD'),
          permissions: configService.get<string>('INVALID_PERMISSION_LENGTH')
        };

        // Act, Assert
        try {
          expect(service.create(createUserDto));
        } catch(error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'o campo "permissions" não pode ter mais do que 4 caracteres.'
          });
        }
      });
    });
    
  });
});
