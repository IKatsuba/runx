import { Module } from '@nestjs/common';
import { CacheModule } from '@runx/api/http/cache';
import { ApiHttpJobModule } from '@runx/api/http/job';
import { ConfigModule, registerAs } from '@nestjs/config';
import { environment } from '../environments/environment';
import { parseConfig } from '@runx/api/env';
import { DbModule } from '@runx/api/db';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        registerAs('db', () => parseConfig(process.env.DB_CONFIG)),
        registerAs('firebase', () => parseConfig(process.env.FIREBASE_CONFIG)),
        registerAs('s3', () => parseConfig(process.env.S3_CONFIG)),
        () => environment,
      ],
    }),
    DbModule.forRoot(),
    CacheModule,
    ApiHttpJobModule,
  ],
})
export class AppModule {}
