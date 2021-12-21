import { S3 } from 'aws-sdk';

export interface S3StorageConfig extends S3.Types.ClientConfiguration {
  bucket: string;
}
