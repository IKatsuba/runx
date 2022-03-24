import { Test, TestingModule } from '@nestjs/testing';
import { CacheController } from './cache.controller';
import { FileStorage } from '@runx/api/storage';
import { Observable, of } from 'rxjs';
import { TokenService } from '@runx/api/auth';

class MockFileStorage extends FileStorage {
  getDownloadUrl(
    hash: string,
    options?: { force: boolean }
  ): Observable<string | null> {
    return of(null);
  }

  getUploadUrl(hash: string): Observable<string> {
    return of(null);
  }
}

describe('CacheController', () => {
  let controller: CacheController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CacheController],
      providers: [
        TokenService,
        {
          provide: FileStorage,
          useClass: MockFileStorage,
        },
      ],
    }).compile();

    controller = module.get<CacheController>(CacheController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
