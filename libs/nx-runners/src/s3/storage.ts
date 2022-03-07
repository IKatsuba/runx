import * as AWS from 'aws-sdk';
import S3 from 'aws-sdk/clients/s3';
import { NoopStorage, Storage } from '../core/storage';
import { OPTIONS } from '../core/options';
import { Readable } from 'stream';
import { S3CachingRunnerOptions } from './runner';

export interface S3StorageOptions extends S3.ClientConfiguration {
  bucket?: string;
  expiration?: number;
}

export class S3Storage extends Storage {
  private readonly s3: AWS.S3;

  private readonly bucket: string;
  private readonly expiration: number;

  /**
   * minio {
   *           "endpoint": "http://192.168.1.4:9000",
   *           "s3BucketEndpoint": true,
   *           "s3ForcePathStyle": true,
   *           "signatureVersion": "v4",
   *           "accessKeyId": "qwerty123",
   *           "secretAccessKey": "qwerty123",
   *           "bucket": "bucket"
   *         }
   */
  constructor({ bucket, expiration, ...s3Options }: S3StorageOptions) {
    super();
    this.s3 = new AWS.S3(s3Options);

    this.bucket = bucket;
    this.expiration = expiration ?? 259200000;
  }

  get(key: string): Promise<Buffer | Uint8Array | Blob | string | Readable> {
    return new Promise((resolve, reject) => {
      this.s3.getObject(
        { Bucket: this.bucket, Key: key },
        function (error, data) {
          if (error !== null) {
            reject('Failed to retrieve an object: ' + error);
          } else {
            resolve(data.Body as any);
          }
        }
      );
    });
  }

  put(
    fileContent: Buffer | Uint8Array | Blob | string | Readable,
    key: string
  ): Promise<S3.PutObjectOutput> {
    const expires = new Date();

    const params: S3.Types.PutObjectRequest = {
      Bucket: this.bucket,
      Key: key,
      Body: fileContent,
      Expires: new Date(expires.getMilliseconds() + this.expiration),
    };

    return new Promise((resolve, reject) => {
      return this.s3.putObject(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
}

export const storageProvider = {
  provide: Storage,
  useFactory: (options: S3CachingRunnerOptions) =>
    options?.s3 ? new S3Storage(options.s3) : new NoopStorage(),
  deps: [OPTIONS],
};
