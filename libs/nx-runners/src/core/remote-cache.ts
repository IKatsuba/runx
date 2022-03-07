import { RemoteCache as IRemoteCache } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import * as path from 'path';
import * as fs from 'fs';
import { archive, extract } from 'simple-archiver';
import { Injectable } from 'injection-js';
import { Storage } from './storage';
import { Logger } from './logger';

export abstract class RemoteCache implements IRemoteCache {
  abstract retrieve(hash: string, cacheDirectory: string): Promise<boolean>;

  abstract store(hash: string, cacheDirectory: string): Promise<boolean>;
}

@Injectable()
export class RemoteCacheImpl extends RemoteCache {
  constructor(private storage: Storage, private logger: Logger) {
    super();
  }

  async store(hash: string, cacheDirectory: string): Promise<boolean> {
    try {
      const directoryToCache = path.join(cacheDirectory, hash);
      this.logger.pending(
        `Trying to archive cache directory: ${directoryToCache}`
      );
      const data = await archive(directoryToCache, {});
      this.logger.success(
        `The cache directory is archived: ${directoryToCache} `
      );

      this.logger.pending(
        `Trying to store cache directory: ${directoryToCache}`
      );
      await this.storage.put(data, hash);
      this.logger.success(`The cache directory is stored: ${directoryToCache}`);

      return true;
    } catch (e) {
      this.logger.warn(`Storing failed:`, e);
      return false;
    }
  }

  async retrieve(hash: string, cacheDirectory: string): Promise<boolean> {
    try {
      this.logger.pending(`Trying to get cache directory: ${cacheDirectory}`);
      const data = await this.storage.get(hash);
      this.logger.success(`The cache directory retrieved: ${cacheDirectory}`);

      this.logger.pending(`Trying to extract data`);
      await extract(data, cacheDirectory);
      fs.writeFileSync(path.join(cacheDirectory, `${hash}.commit`), 'true');
      this.logger.success(`Data extracted`);

      return true;
    } catch (e) {
      this.logger.warn(`Retrieving failed:`, e);
      return false;
    }
  }
}

export const remoteCacheProvider = {
  provide: RemoteCache,
  useClass: RemoteCacheImpl,
};
