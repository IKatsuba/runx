import { Module } from '@nestjs/common';
import { CacheModule } from '@runx/api/http/cache';
import { ConfigModule, registerAs } from '@nestjs/config';
import { environment } from '../environments/environment';
import { parseConfig } from '@runx/api/env';
import { DbModule, JobEntity, TaskEntity } from '@runx/api/db';
import { ApiHttpJobModule } from '@runx/api/http/job';
import { TypeOrmModule } from '@nestjs/typeorm';

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
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      entities: [JobEntity, TaskEntity],
      synchronize: true,
    }),
    DbModule,
    ApiHttpJobModule,
  ],
})
export class AppModule {}
