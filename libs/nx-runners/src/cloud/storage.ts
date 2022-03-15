import { NoopStorage, Storage } from '../core/storage';
import { Readable } from 'stream';
import axios, { Axios } from 'axios';
import { Optional } from 'injection-js';
import { TaskCache } from '../core/cache';

export class CloudStorage extends Storage {
  constructor(private api: Axios) {
    super();
  }

  async get(
    key: string
  ): Promise<Buffer | Uint8Array | Blob | string | Readable> {
    const { data: { getUrl } = {} } = await this.api.get<TaskCache>(
      `v1/cache/${key}`
    );

    if (!getUrl) {
      throw new Error('No cache URL found');
    }

    const response = await axios.get(getUrl, {
      responseType: 'stream',
    });

    return response.data;
  }

  async put(
    fileContent: Buffer | Uint8Array | Blob | string | Readable,
    key: string
  ): Promise<any> {
    const { data: { putUrl } = {} } = await this.api.get<TaskCache>(
      `v1/cache/${key}`
    );

    await axios.put(putUrl, fileContent, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
  }
}

export const storageProvider = {
  provide: Storage,
  useFactory: (api: Axios) => (api ? new CloudStorage(api) : new NoopStorage()),
  deps: [[new Optional(), Axios]],
};
