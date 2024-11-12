import { Test, TestingModule } from '@nestjs/testing';
import { SocialSpacesService } from './social-spaces.service';

describe('SocialSpacesService', () => {
  let service: SocialSpacesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocialSpacesService],
    }).compile();

    service = module.get<SocialSpacesService>(SocialSpacesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
