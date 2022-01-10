import { Module } from '@nestjs/common';
import { CacheModule } from '@nx-cloud/api/http/cache';
import { ConfigModule, registerAs } from '@nestjs/config';
import { environment } from '../environments/environment';
import { parseConfig } from '@nx-cloud/api/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => environment,
        registerAs('firebase', () => parseConfig(process.env.FIREBASE_CONFIG)),
        registerAs('s3', () => parseConfig(process.env.S3_CONFIG)),
      ],
    }),
    CacheModule,
  ],
})
export class AppModule {}
