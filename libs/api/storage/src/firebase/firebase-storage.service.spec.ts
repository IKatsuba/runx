import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseStorageService } from './firebase-storage.service';

describe('FirebaseStorageService', () => {
  let service: FirebaseStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirebaseStorageService],
    }).compile();

    service = module.get<FirebaseStorageService>(FirebaseStorageService);
  });

  xit('should be defined', () => {
    expect(service).toBeDefined();
  });
});
