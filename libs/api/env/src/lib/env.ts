import { S3StorageConfig } from './s3-storage-config';
import { FirebaseStorageConfig } from './firebase-storage-config';

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
