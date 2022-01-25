import { FileStorage } from '../lib/file-storage';
import { defer, Observable } from 'rxjs';
import { S3StorageConfig } from '@runx/api/env';
import { switchMap } from 'rxjs/operators';
import * as AWS from 'aws-sdk';

export class S3StorageService extends FileStorage {
  private readonly client: AWS.S3;

  constructor(private config: S3StorageConfig) {
    super();

    const { bucket, ...s3Config } = this.config;

    this.client = new AWS.S3(s3Config);
  }

  getDownloadUrl(
    hash: string,
    { force = false }: { force?: boolean } = {}
  ): Observable<string> {
    const url = () => {
      return defer(() => {
        return this.client.getSignedUrlPromise('getObject', {
          Bucket: this.config.bucket,
          Key: hash,
        });
      });
    };

    if (force) {
      return url();
    }

    return this.hasObject(hash).pipe(
      switchMap((isExist) => {
        if (isExist) {
          return url();
        }

        return Promise.resolve(null);
      })
    );
  }

  getUploadUrl(hash: string): Observable<string> {
    return defer(() => {
      return this.client.getSignedUrlPromise('putObject', {
        Bucket: this.config.bucket,
        Key: hash,
        ContentType: 'application/octet-stream',
      });
    });
  }

  hasObject(hash: string): Observable<boolean> {
    return new Observable((subscriber) => {
      this.client.headObject(
        { Bucket: this.config.bucket, Key: hash },
        (err, data) => {
          if (err) {
            if (err.name === 'NotFound') {
              subscriber.next(false);
              subscriber.complete();
            } else {
              subscriber.error(err);
            }
          } else {
            subscriber.next(true);
            subscriber.complete();
          }
        }
      );
    });
  }
}
