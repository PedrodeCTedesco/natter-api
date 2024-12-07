import { UsersService } from './users.service';
import { setupTest } from '../../test/setuo/setup'
import { BadRequestException, INestApplication } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';

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
      const adminUser = users.find(u => u.user_id === createUserDto.username);
    
      expect(adminUser.permissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ perms: createUserDto.permissions })
        ])
      );
    });

    it('should throw error when creating duplicate user', async () => {
      const createUserDto = {
        username: 'duplicateuser',
        password: 'password123',
      };
    
      // Primeiro, cria um usuário com sucesso
      const result = await service.create(createUserDto);
      expect(result).toEqual({
        username: createUserDto.username,
        created: true,
      });
    
      // Tenta criar outro usuário com o mesmo username e verifica se lança um erro
      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
    
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
});
