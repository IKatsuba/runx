import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiHttpJobEntity, TaskEntity } from './entities';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      entities: [ApiHttpJobEntity, TaskEntity],
      synchronize: true,
    }),
  ],
})
export class DbModule {}
