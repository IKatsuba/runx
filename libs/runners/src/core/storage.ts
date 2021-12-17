import { Readable } from 'stream';

export abstract class Storage {
  abstract get(
    key: string
  ): Promise<Buffer | Uint8Array | Blob | string | Readable>;
  abstract put(
    fileContent: Buffer | Uint8Array | Blob | string | Readable,
    key: string
  ): Promise<any>;
}

export class NoopStorage implements Storage {
  get(key: string): Promise<Buffer | Uint8Array | Blob | string | Readable> {
    return Promise.reject(`Failed to retrieve an object ${key}`);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  put(
    fileContent: Buffer | Uint8Array | Blob | string | Readable,
    key: string
  ): Promise<any> {
    return Promise.reject(`Failed to store an object ${key}`);
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export const noopStorageProvider = {
  provide: Storage,
  useClass: NoopStorage,
};
