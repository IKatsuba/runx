import { FirebaseStorageConfig, S3StorageConfig } from '@nx-cloud/api/storage';

export enum StorageProvider {
  Firebase = 'firebase',
  S3 = 's3',
}

export interface Environment {
  provider: StorageProvider;
  production: boolean;
  s3?: S3StorageConfig;
  firebase?: FirebaseStorageConfig;
}
