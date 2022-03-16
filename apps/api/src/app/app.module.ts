import { Module } from '@nestjs/common';
import { CacheModule } from '@runx/api/http/cache';
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { environment } from '../environments/environment';
import { Environment, parseConfig } from '@runx/api/env';
import { DbModule, JobEntity, TaskEntity } from '@runx/api/db';
import { ApiHttpJobModule } from '@runx/api/http/job';
import { TypeOrmModule } from '@nestjs/typeorm';

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
    CacheModule,
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService<Environment>) => ({
        ...config.get('db'),
        entities: [JobEntity, TaskEntity],
      }),
      inject: [ConfigService],
    }),
    DbModule,
    ApiHttpJobModule,
  ],
})
export class AppModule {}
