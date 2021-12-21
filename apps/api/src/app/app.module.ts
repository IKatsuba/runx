import { Module } from '@nestjs/common';
import { CacheModule } from '@nx-cloud/api/cache';
import { ConfigModule, registerAs } from '@nestjs/config';
import { environment } from '../environments/environment';
import { loadConfig } from '@nx-cloud/api/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => environment,
        registerAs('firebase', () => loadConfig(process.env.FIREBASE_CONFIG)),
        registerAs('s3', () => loadConfig(process.env.S3_CONFIG)),
      ],
    }),
    CacheModule,
  ],
})
export class AppModule {}
