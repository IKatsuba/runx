import { Module } from '@nestjs/common';
import { ApiHttpCacheModule } from '@runx/api/http/cache';
import { ApiHttpWorkspaceModule } from '@runx/api/http/workspace';
import { ApiHttpJobModule } from '@runx/api/http/job';
import { ApiHttpTaskModule } from '@runx/api/http/task';
import { ConfigModule, registerAs } from '@nestjs/config';
import { environment } from '../environments/environment';
import { parseConfig } from '@runx/api/env';
import { DbModule } from '@runx/api/db';
import { ApiMetricsModule } from '@runx/api/metrics';
import { ApiAuthModule } from '@runx/api/auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        registerAs('prometheus', () =>
          parseConfig(process.env.PROMETHEUS_CONFIG)
        ),
        registerAs('db', () => parseConfig(process.env.DB_CONFIG)),
        registerAs('firebase', () => parseConfig(process.env.FIREBASE_CONFIG)),
        registerAs('s3', () => parseConfig(process.env.S3_CONFIG)),
        () => environment,
      ],
    }),
    DbModule.forRoot(),
    ApiHttpWorkspaceModule,
    ApiHttpCacheModule,
    ApiHttpJobModule,
    ApiHttpTaskModule,
    ApiMetricsModule.forRoot(),
    ApiAuthModule,
  ],
})
export class AppModule {}
