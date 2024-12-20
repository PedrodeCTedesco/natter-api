import { UsersService } from './users.service';
import { setupTest } from '../../test/setup/setup'
import { BadRequestException, INestApplication } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { SavedUser, User } from './interfaces/user.interface';
import { USER_METHODS } from './constants/identifiers.methods';

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

  it.skip('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe(USER_METHODS.CREATE, () => {
    describe('sucess', () => {
      it('should create a new user successfully without permissions', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('USERNAME'),
          password: configService.get<string>('PASSWORD'),
        };
        // Act
        const result: SavedUser = await service.create(createUserDto);
        // Assert
        expect(result).toEqual({
          username: createUserDto.username,
          created: true,
        });
      });
  
      it('should create a user with admin permissions', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('USERNAME'),
          password: configService.get<string>('PASSWORD'),
          permissions: configService.get<string>('ADMIN'),
          spaceId: 1
        };
        
        // Act
        const result: SavedUser = await service.create(createUserDto);
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

      it('should return username as string value and created as boolean value', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('USERNAME'),
          password: configService.get<string>('PASSWORD'),
        };
        
        // Act
        const result: SavedUser = await service.create(createUserDto);
        // Assert
        expect(typeof result.username).toBe('string');
        expect(typeof result.created).toBe('boolean');
      });

      it('should return object with the defined structure', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('USERNAME'),
          password: configService.get<string>('PASSWORD'),
        };
        
        // Act
        const result: SavedUser = await service.create(createUserDto);
        // Assert
        expect(result).toMatchObject({
          username: expect.any(String),
          created: expect.any(Boolean)
        })
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

      it('should throw error when creating duplicate user', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('DUPLICATED_USERNAME'),
          password: configService.get<string>('PASSWORD'),
        };
      
        // Act, Assert
        const result: SavedUser = await service.create(createUserDto);
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

      it('should reject username with special characteres', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('USERNAME_WITH_SPECIAL_CHARACTERES'),
          password: configService.get<string>('PASSWORD')
        };
        
        // Act, Assert
        try {
          await service.create(createUserDto);
          fail('Deveria ter lançado uma exceção');
        } catch(error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'O campo "username" é inválido. Ele deve começar com uma letra e conter apenas letras e números, ter no máximo 30 caracteres e não possuir caracteres especiais.'
          });
        }
      });

      it('should reject username with more than 30 characteres', async () => {
        // Arrange
        const longUsername: string = 'a'.repeat(31);
        const createUserDto: CreateUserDto = {
          username: longUsername,
          password: configService.get<string>('PASSWORD')
        };
        
        // Act, Assert
        try {
          await service.create(createUserDto);
          fail('Deveria ter lançado uma exceção');
        } catch(error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'O campo "username" é inválido. Ele deve começar com uma letra e conter apenas letras e números, ter no máximo 30 caracteres e não possuir caracteres especiais.'
          });
        }
      });

      it('should accept username with exactly 30 characteres', async () => {
        // Arrange
        const longUsername: string = 'a'.repeat(30);
        const createUserDto: CreateUserDto = {
          username: longUsername,
          password: configService.get<string>('PASSWORD')
        };
        // Act
        const result: SavedUser = await service.create(createUserDto);
        // Assert
        expect(result).toEqual({
          username: createUserDto.username,
          created: true,
        });
      });

      it('should validate password meets minimum requirements', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get<string>('USERNAME'),
          password: configService.get<string>('INVALID_PASSWORD_LENGTH')
        };
        // Act, Assert
        try {
          await service.create(createUserDto);
        } catch(error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'O campo "password" deve ter entre 9 e 255 caracteres.'
          })
        }
      });

      it('should not allow password with only letters', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get('USERNAME'),
          password: configService.get<string>('INVALID_PASSWORD_FORMAT_ONLY_LETTERS')
        };
    
        // Act, Assert
        try {
          await service.create(createUserDto);
          fail('Deveria ter lançado uma exceção');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'A senha deve conter pelo menos uma letra, um número e um caractere especial.'
          });
        }
      });

      it('should not allow password with only numbers and special characteres', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get('USERNAME'),
          password: configService.get<string>('INVALID_PASSWORD_FORMAT_ONLY_NUMBERS_AND_SPECIAL_CHARACTERES')
        };
    
        // Act, Assert
        try {
          await service.create(createUserDto);
          fail('Deveria ter lançado uma exceção');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'A senha deve conter pelo menos uma letra, um número e um caractere especial.'
          });
        }
      });

      it('should not allow password with only numbers and letters', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get('USERNAME'),
          password: configService.get<string>('INVALID_PASSWORD_FORMAT_NO_SPECIAL_CHARACTER')
        };
    
        // Act, Assert
        try {
          await service.create(createUserDto);
          fail('Deveria ter lançado uma exceção');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'A senha deve conter pelo menos uma letra, um número e um caractere especial.'
          });
        }
      });

      it('should not allow empty password', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get('USERNAME'),
          password: ''
        };
    
        // Act, Assert
        try {
          await service.create(createUserDto);
          fail('Deveria ter lançado uma exceção');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'O campo "password" não pode estar vazio.'
          });
        }
      });

      it('should not allow password with exactly 8 characteres', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get('USERNAME'),
          password: 'a1@ba1@b'
        };
    
        // Act, Assert
        try {
          await service.create(createUserDto);
          fail('Deveria ter lançado uma exceção');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'A senha deve conter pelo menos uma letra, um número e um caractere especial.'
          });
        }
      });

      it('should not allow password with more than 255 characteres', async () => {
        // Arrange
        const createUserDto: CreateUserDto = {
          username: configService.get('USERNAME'),
          password: 'a1@ba1@b'.repeat(256)
        };
    
        // Act, Assert
        try {
          await service.create(createUserDto);
          fail('Deveria ter lançado uma exceção');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.response).toEqual({
            status: 400,
            message: 'O campo "password" deve ter entre 9 e 255 caracteres.'
          });
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
          await service.create(createUserDto);
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
          await service.create(createUserDto);
          fail('Deveria ter lançado uma exceção');
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

  describe(USER_METHODS.FIND_ALL, () => {
    describe('success', () => {
      it('should return the users with the correct interface', async () => {
        // Arrange, Act
        const result = await service.getUsers();
      
        // Assert
        result.forEach(user => {
          expect(user).toMatchObject({
            user_id: expect.any(String),
            permissions: expect.any(Array),
          });
      
          user.permissions.forEach(permission => {
            expect(permission).toMatchObject({
              space_id: expect.anything(), 
              perms: expect.anything() 
            });
          });
        });
      });
    });

    describe('failure', () => {
      it('should handle no users returned', async () => {
        jest.spyOn(service, USER_METHODS.FIND_ALL).mockResolvedValue([]);
    
        const result = await service.getUsers();
        expect(result).toHaveLength(0);
      });
    });
    
    
  })
});
