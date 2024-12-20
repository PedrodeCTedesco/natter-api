import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from './audit_logging.service';
import { setupTest } from '../../test/setup/setup';
import { AUDIT_LOGGING_SERVICE } from './constants/audit.logging.method.identifiers';
import * as request from 'supertest';

describe('AuditLoggingService', () => {
  let configService: ConfigService;
  let app: INestApplication;
  let service: AuditService;

  beforeEach(async () => {
    const module = await setupTest('Audit_Logging');

    service = module.get<AuditService>(AuditService);
    configService = module.get<ConfigService>(ConfigService);
    app = module.createNestApplication();
    await app.init();

    service = module.get<AuditService>(AuditService);
  });

  it.skip('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('GET_AUDIT_LOGS_WITH_FILTERS', () => {
    describe('edge cases', () => {
      it('should handle negative limit', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        const limit: string = "-50";
      
        // Act
        await request(app.getHttpServer())
          .get('/audit/logs')
          .query({ limit: limit });
      
        // Assert
        const callArgs = spy.mock.calls[0]; 
        expect(callArgs[0]).toBe(1);
      
      });

      it('should handle limit exceeding maximum', async () => {
        // Arrange
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        const exceedingLimit: string = '2000';

        // Act
        await request(app.getHttpServer())
          .get('/audit/logs')
          .query({ limit: exceedingLimit });

        // Assert
        const callArgs = spy.mock.calls[0]; 
        expect(callArgs[0]).toBe(1000);
        expect(spy).toHaveBeenCalledWith(1000, 0, undefined, undefined, undefined, undefined);
      });

      it('should not allow special characters in user id and escape them correctly', async () => {
        // Arrange
        const spyEscapeSpecialCharacters = jest.spyOn(require('../auth/input.validation/input.validation.helper'), 'escapeSpecialCharacters');
        const invalidUserId: string = configService.get<string>('USERNAME_WITH_SPECIAL_CHARACTERES');
        const spy = jest.spyOn(service, AUDIT_LOGGING_SERVICE.GET_AUDIT_LOGS_WITH_FILTERS);
        
        // Act
        await request(app.getHttpServer())
          .get('/audit/logs')
          .query({ limit: 100, offset: 0, userId: invalidUserId });
        
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
  });
});
