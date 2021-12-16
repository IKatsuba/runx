import * as AWS from 'aws-sdk';
import S3 from 'aws-sdk/clients/s3';

export interface S3StorageOptions extends S3.ClientConfiguration {
  bucket?: string;
  expiration?: number;
}

export class S3Storage {
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
  constructor({ bucket, expiration, ...s3Options }: S3StorageOptions = {}) {
    this.s3 = new AWS.S3(s3Options);

    this.bucket = bucket;
    this.expiration = expiration ?? 259200000;
  }

  get(key: string): Promise<S3.GetObjectOutput> {
    return new Promise((resolve, reject) => {
      this.s3.getObject(
        { Bucket: this.bucket, Key: key },
        function (error, data) {
          if (error !== null) {
            reject('Failed to retrieve an object: ' + error);
          } else {
            resolve(data);
          }
        }
      );
    });
  }

  put(fileContent: any, key: string): Promise<S3.PutObjectOutput> {
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
