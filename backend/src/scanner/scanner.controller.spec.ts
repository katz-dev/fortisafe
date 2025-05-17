import { Test, TestingModule } from '@nestjs/testing';
import { ScannerController } from './scanner.controller';
import { ScannerService } from './scanner.service';

describe('ScannerController', () => {
  let controller: ScannerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScannerController],
      providers: [ScannerService],
    }).compile();

    controller = module.get<ScannerController>(ScannerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
