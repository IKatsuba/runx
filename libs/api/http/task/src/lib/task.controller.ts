import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaskEntity } from '@runx/api/db';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthGuard } from '@runx/api/auth';

@Controller('task')
@UseGuards(AuthGuard)
export class TaskController {
  constructor(
    @InjectRepository(TaskEntity) private taskRepo: Repository<TaskEntity>
  ) {}

  @Post(':taskId')
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() task: TaskEntity
  ): Promise<TaskEntity> {
    await this.taskRepo.update(taskId, task);

    return this.taskRepo.findOne(taskId);
  }

  @Get()
  getJobTasks(@Query('jobId') jobId: string) {
    return this.taskRepo.find({
      where: { job: { jobId } },
    });
  }
}
