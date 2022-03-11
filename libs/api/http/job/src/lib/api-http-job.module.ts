import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity, TaskEntity } from '@runx/api/db';

@Module({
  controllers: [JobController],
  imports: [TypeOrmModule.forFeature([JobEntity, TaskEntity])],
  exports: [],
})
export class ApiHttpJobModule {}
