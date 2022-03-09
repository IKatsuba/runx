import { NoopStorage, Storage } from '../core/storage';
import { Readable } from 'stream';
import axios, { Axios } from 'axios';
import { Optional } from 'injection-js';

export class CloudStorage extends Storage {
  constructor(private api: Axios) {
    super();
  }

  async get(
    key: string
  ): Promise<Buffer | Uint8Array | Blob | string | Readable> {
    const {
      data: [url],
    } = await this.api.get(`cache/${key}/urls`);

    if (!url) {
      throw new Error('No cache URL found');
    }

    const response = await axios.get(url, {
      responseType: 'stream',
    });

    return response.data;
  }

  async put(
    fileContent: Buffer | Uint8Array | Blob | string | Readable,
    key: string
  ): Promise<any> {
    const {
      data: [, url],
    } = await this.api.get(`cache/${key}/urls`);

    await axios.put(url, fileContent, {
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
