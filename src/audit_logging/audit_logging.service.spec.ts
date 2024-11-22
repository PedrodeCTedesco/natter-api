import { Test, TestingModule } from '@nestjs/testing';
import { AuditLoggingService } from './audit_logging.service';

describe('AuditLoggingService', () => {
  let service: AuditLoggingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLoggingService],
    }).compile();

    service = module.get<AuditLoggingService>(AuditLoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
