import { AuditLoggingController } from './audit_logging.controller';
import { setupTest } from '../../test/setup/setup';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus, INestApplication } from '@nestjs/common';
import { AUDIT_LOGGING_SERVICE } from './constants/audit.logging.method.identifiers';
import { AuditService } from './audit_logging.service';

describe('AuditLoggingController', () => {
  let controller: AuditLoggingController;
  let configService: ConfigService;
  let app: INestApplication;
  let service: AuditService;

  beforeEach(async () => {
    const module = await setupTest('Audit_Logging');

    controller = module.get<AuditLoggingController>(AuditLoggingController);
    service = module.get<AuditService>(AuditService);
    configService = module.get<ConfigService>(ConfigService);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get all logs', () => {
    describe('success', () => {
      it('should return empty array when no logs exist', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOG_DETAILS).mockResolvedValue([]);

        // Act
        const result = await controller.getAllLogs();

        // Assert
        expect(result).toEqual([]);
        expect(spy).toHaveBeenCalledTimes(1);
      });

      it('should return array of logs when logs exist', async () => {
        // Arrange
        const mockLogs = [
          {
            id: parseInt(configService.get<string>('ID_AUDIT'), 10), 
            method: configService.get<string>('GET'), 
            path: configService.get<string>('PATH_AUDIT'), 
            status: parseInt(configService.get<string>('STATUS_OK'), 10), 
            user: configService.get<string>('USERNAME'), 
            time: new Date()
          },
          {
            id: parseInt(configService.get<string>('ID_AUDIT'), 10), 
            method: configService.get<string>('GET'), 
            path: configService.get<string>('PATH_AUDIT'), 
            status: parseInt(configService.get<string>('STATUS_OK'), 10),
            user: configService.get<string>('USERNAME'),
            time: new Date()
          }
        ];
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOG_DETAILS).mockResolvedValue(mockLogs);

        // Act
        const result = await controller.getAllLogs();

        // Assert
        expect(result).toEqual(mockLogs);
        expect(spy).toHaveBeenCalledTimes(1);
      });

      it('should return large dataset without pagination', async () => {
        // Arrange
        const mockLogs = Array.from({ length: 1000 }, (_, i) => ({
          id: parseInt(configService.get<string>('ID_AUDIT'), 10), 
          method: configService.get<string>('GET'), 
          path: configService.get<string>('PATH_AUDIT'), 
          status: parseInt(configService.get<string>('STATUS_OK'), 10), 
          user: configService.get<string>('USERNAME'), 
          time: new Date()
        }));
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOG_DETAILS).mockResolvedValue(mockLogs);
      
        // Act
        const result = await controller.getAllLogs();
      
        // Assert
        expect(result).toHaveLength(1000);
        expect(result).toEqual(mockLogs);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe('error', () => {
      it('should handle service returning null', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOG_DETAILS).mockResolvedValue(null);
        // Act
        const result = await controller.getAllLogs();

        // Assert
        expect(result).toBeNull();
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('get logs', () => {
    describe('parameter limit validation', () => {
      it('should use default values when no parameters are provided', async () => {
        // Arrange
        const expectedResponse = { logs: [], total: 0 };
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS).mockResolvedValue(expectedResponse);
        const userId: string = configService.get<string>('USERNAME');
  
        // Act
        await controller.getLogs(100, 0, userId);
  
        // Assert
        expect(spy).toHaveBeenCalledWith(100, 0, userId, undefined, undefined, undefined);
      });

      it('should handle limit as string', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        const userId: string = configService.get<string>('USERNAME');
        const exceedingLimit: string = configService.get<string>('INVALID_LIMIT');

        // Act
        await controller.getLogs(exceedingLimit as any, 0, userId);

        // Assert
        expect(spy).toHaveBeenCalledWith(1000, 0, userId, undefined, undefined, undefined);
      });

      it('should handle non-numeric limit with exception', async () => {
        // Arrange
        const stringLimitFormat: string = configService.get<string>('INVALID_LIMIT_CHARACTER');
      
        // Act & Assert
        await expect(controller.getLogs(stringLimitFormat as any))
          .rejects
          .toThrow(new HttpException('Invalid limit value', HttpStatus.BAD_REQUEST));
      });
    });

    describe('offset parameter edge cases', () => {
      it('should handle negative offset', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        const offset: string = configService.get<string>('INVALID_OFFSET');
        const userId: string = configService.get<string>('USERNAME');

        // Act
        await controller.getLogs(100, offset as any, userId);
        // Assert
        expect(spy).toHaveBeenCalledWith(100, 0, userId, undefined, undefined, undefined);
      });

      it('should handle very large offset', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        const offset: number = Number.MAX_SAFE_INTEGER;
        const userId: string = configService.get<string>('USERNAME');

        // Act
        await controller.getLogs(100, offset, userId);
        // Assert
        expect(spy).toHaveBeenCalledWith(100, offset, userId, undefined, undefined, undefined);
      });
    });

    describe('date parameter edge cases', () => {
      it('should handle invalid start date', async () => {
        // Arrange
        jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        const invalidStartDate: string = configService.get<string>('INVALID_START_DATE');
        const userId: string = configService.get<string>('USERNAME');

        // Act, Assert
        await expect(controller.getLogs(
          100, 0, userId, undefined, invalidStartDate)).rejects.toThrow(HttpException);
      });

      it('should handle invalid start date', async () => {
        // Arrange
        jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        const invalidEndDate: string = configService.get<string>('INVALID_END_DATE');
        const userId: string = configService.get<string>('USERNAME');

        // Act, Assert
        await expect(controller.getLogs(
          100, 0, userId, undefined, undefined, invalidEndDate)).rejects.toThrow(HttpException);
      });

      it('should handle end date before start date', async () => {
        // Arrange
        jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        const endDate: string = configService.get<string>('INVALID_END_DATE_APRIL');
        const startDate: string = configService.get<string>('INVALID_START_DATE_JUNE');
        const userId: string = configService.get<string>('USERNAME');
      
        // Act, Assert
        await expect(controller.getLogs(
          100, 0, userId, undefined, startDate, endDate
        )).rejects.toThrow(new HttpException(
          'Start date cannot be later than end date',
          HttpStatus.BAD_REQUEST
        ));
      });

      it('should handle future dates', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const userId: string = configService.get<string>('USERNAME');

        // Act
        await controller.getLogs(100, 0, userId, undefined, undefined, futureDate.toISOString());

        // Assert
        expect(spy).toHaveBeenCalledWith(100, 0, userId, undefined, undefined, futureDate.toISOString());
      });
      
    });

    describe('user id edge cases', () => {
      it('should handle empty userId string', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        // Act
        await controller.getLogs(100, 0, '');
        // Assert
        expect(spy).toHaveBeenCalledWith(100, 0, '', undefined, undefined, undefined);
      });

      it('accept user id as undefined', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        // Act
        await controller.getLogs(100, 0);
        // Assert
        expect(spy).toHaveBeenCalledWith(100, 0, undefined, undefined, undefined, undefined);
      });

      it('should not allow special characters in user id and escape them correctly', async () => {
        // Arrange
        const spyEscapeSpecialCharacters = jest.spyOn(require('../auth/input.validation/input.validation.helper'), 'escapeSpecialCharacters');
        const invalidUserId: string = configService.get<string>('USERNAME_WITH_SPECIAL_CHARACTERES');
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        
        // Act
        await controller.getLogs(100, 0, invalidUserId);
        
        // Assert
        expect(spyEscapeSpecialCharacters).toHaveBeenCalledWith(invalidUserId);
        expect(spy).toHaveBeenCalledWith(
          100,
          0,
          'name&ampinvalid',
          undefined,
          undefined,
          undefined
        );
      });
    });

    describe('method edge cases', () => {
      it('should handle lowercase method', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        const userId: string = configService.get<string>('USERNAME');
        // Act, Assert
        await controller.getLogs(100, 0, userId, 'get');
        expect(spy)
          .toHaveBeenCalledWith(100, 0, userId, 'get', undefined, undefined);
      });

      it('should handle invalid HTTP method', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        const userId: string = configService.get<string>('USERNAME');
        // Act
        await controller.getLogs(100, 0, userId, 'INVALID_METHOD');
        // Assert
        expect(spy)
          .toHaveBeenCalledWith(100, 0, userId, 'INVALID_METHOD', undefined, undefined);
      });
    });
  });
});
