import { RemoteCache as IRemoteCache } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import * as path from 'path';
import * as fs from 'fs';
import { archive, extract } from 'simple-archiver';
import { Injectable } from 'injection-js';
import { Storage } from './storage';

export abstract class RemoteCache implements IRemoteCache {
  abstract retrieve(hash: string, cacheDirectory: string): Promise<boolean>;

  abstract store(hash: string, cacheDirectory: string): Promise<boolean>;
}

@Injectable()
export class RemoteCacheImpl extends RemoteCache {
  constructor(private storage: Storage) {
    super();
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
      await extract(data, cacheDirectory);
      fs.writeFileSync(path.join(cacheDirectory, `${hash}.commit`), 'true');

      return true;
    } catch (e) {
      return false;
    }
  }
}

export const remoteCacheProvider = {
  provide: RemoteCache,
  useClass: RemoteCacheImpl,
};
