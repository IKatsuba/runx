import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FileStorage } from '@runx/api/storage';
import { combineLatest, forkJoin, Observable } from 'rxjs';

@Controller('cache')
export class CacheController {
  constructor(private fileStorage: FileStorage) {}

  @Post()
  getManyUrls(
    @Body() hashes: string[]
  ): Observable<Record<string, [get: string, put: string]>> {
    return forkJoin<Record<string, Observable<[get: string, put: string]>>>(
      hashes.reduce((acc, hash) => {
        acc[hash] = this.getUrls(hash);

        return acc;
      }, {})
    );
  }

  @Get('/:hash/urls')
  getUrls(@Param('hash') hash: string): Observable<[get: string, put: string]> {
    return combineLatest([
      this.fileStorage.getDownloadUrl(hash),
      this.fileStorage.getUploadUrl(hash),
    ]);
  }
}
