import { DynamicModule, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Environment } from '@runx/api/env';
import { JobEntity, TaskEntity } from './entities';

@Global()
@Module({})
export class DbModule {
  static forRoot(): DynamicModule {
    return {
      module: DbModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: (config: ConfigService<Environment>) => ({
            ...config.get('db'),
            entities: [JobEntity, TaskEntity],
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([JobEntity, TaskEntity]),
      ],
      exports: [TypeOrmModule],
    };
  }
}
