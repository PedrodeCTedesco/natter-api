import { Test, TestingModule } from '@nestjs/testing';
import { AuditLoggingController } from './audit_logging.controller';
import { AuditLoggingService } from './audit_logging.service';

describe('AuditLoggingController', () => {
  let controller: AuditLoggingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLoggingController],
      providers: [AuditLoggingService],
    }).compile();

    controller = module.get<AuditLoggingController>(AuditLoggingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
