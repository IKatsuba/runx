import { Module } from '@nestjs/common';
import { CacheController } from './cache.controller';
import { StorageModule } from '@runx/api/storage';

@Module({
  controllers: [CacheController],
  imports: [StorageModule],
})
export class ApiHttpCacheModule {}
