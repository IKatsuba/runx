import { RemoteCache } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { S3Storage, S3StorageOptions } from './s3-storage';
import * as path from 'path';
import * as fs from 'fs';
import { archive, extract } from 'simple-archiver';

export class S3Cache implements RemoteCache {
  private readonly storage: S3Storage;

  constructor(options: S3StorageOptions = {}) {
    this.storage = new S3Storage(options);
  }

  async store(hash: string, cacheDirectory: string): Promise<boolean> {
    try {
      const directoryToCache = path.join(cacheDirectory, hash);
      const data = await archive(directoryToCache, {});
      await this.storage.put(data, hash);

      return true;
    } catch (e) {
      return false;
    }
  }

  async retrieve(hash: string, cacheDirectory: string): Promise<boolean> {
    try {
      const data = await this.storage.get(hash);
      await extract(data.Body, cacheDirectory);
      fs.writeFileSync(path.join(cacheDirectory, `${hash}.commit`), 'true');

      return true;
    } catch (e) {
      return false;
    }
  }
}
