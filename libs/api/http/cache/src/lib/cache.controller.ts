import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { FileStorage } from '@runx/api/storage';
import {
  forkJoin,
  merge,
  Observable,
  of,
  toArray,
  catchError,
  NEVER,
} from 'rxjs';
import { TaskCache } from '@runx/nx-runners/src/core/cache';
import { AuthGuard } from '@runx/api/auth';

@Controller('cache')
@UseGuards(AuthGuard)
export class CacheController {
  constructor(private fileStorage: FileStorage) {}

  @Get()
  getHashes(@Query('hashes') hashes: string[]): Observable<TaskCache[]> {
    return merge(
      ...hashes.map((hash) => this.getHash(hash).pipe(catchError(() => NEVER)))
    ).pipe(toArray());
  }

  @Get('/:hash')
  getHash(@Param('hash') hash: string): Observable<TaskCache> {
    return forkJoin({
      id: of(hash),
      getUrl: this.fileStorage.getDownloadUrl(hash),
      putUrl: this.fileStorage.getUploadUrl(hash),
    });
  }
}
