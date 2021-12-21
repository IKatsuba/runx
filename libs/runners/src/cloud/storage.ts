import { NoopStorage, Storage } from '../core/storage';
import { OPTIONS } from '../core/options';
import { Readable } from 'stream';
import { CloudRunnerOptions } from './runner';
import axios, { AxiosInstance } from 'axios';

export class CloudStorage extends Storage {
  private api: AxiosInstance;

  constructor(apiUrl: string) {
    super();

    this.api = axios.create({ baseURL: apiUrl });
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
  useFactory: (options: CloudRunnerOptions) =>
    options?.apiUrl ? new CloudStorage(options.apiUrl) : new NoopStorage(),
  deps: [OPTIONS],
};
