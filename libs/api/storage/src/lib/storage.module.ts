import { Module } from '@nestjs/common';
import { FileStorage } from './file-storage';
import { ConfigService } from '@nestjs/config';
import { Environment } from '@nx-cloud/api/env';
import { FirebaseStorageService } from '../firebase/firebase-storage.service';
import { FirebaseStorageConfig } from '../firebase/firebase-storage-config.token';
import { S3StorageService } from '../s3/s3-storage.service';
import { S3StorageConfig } from '../s3/s3-storage-config.token';

@Module({
  imports: [],
  providers: [
    {
      provide: FileStorage,
      useFactory(config: ConfigService): FileStorage {
        const provider = config.get<Environment['provider']>('provider');

        switch (provider) {
          case 'firebase':
            return new FirebaseStorageService(
              config.get<FirebaseStorageConfig>(provider)
            );
          case 's3':
            return new S3StorageService(config.get<S3StorageConfig>(provider));
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [FileStorage],
})
export class StorageModule {}
