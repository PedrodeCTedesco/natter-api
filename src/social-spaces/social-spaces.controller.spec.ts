import { Test, TestingModule } from '@nestjs/testing';
import { SocialSpacesController } from './social-spaces.controller';
import { SocialSpacesService } from './social-spaces.service';

describe('SocialSpacesController', () => {
  let controller: SocialSpacesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialSpacesController],
      providers: [SocialSpacesService],
    }).compile();

    controller = module.get<SocialSpacesController>(SocialSpacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
