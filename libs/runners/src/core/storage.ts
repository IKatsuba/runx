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

  put(
    fileContent: Buffer | Uint8Array | Blob | string | Readable,
    key: string
  ): Promise<any> {
    return Promise.resolve(undefined);
  }
}
