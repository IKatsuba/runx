import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JobEntity, TaskEntity } from '@runx/api/db';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '@runx/nx-runners/src/core/job';
import groupBy from '@tinkoff/utils/object/groupBy';
import { AuthGuard } from '@runx/api/auth';

@Controller('job')
@UseGuards(AuthGuard)
export class JobController {
  constructor(
    @InjectRepository(JobEntity) private jobRepo: Repository<JobEntity>,
    @InjectRepository(TaskEntity) private taskRepo: Repository<TaskEntity>
  ) {}

  @Post()
  async createJob(@Body() job: Job): Promise<JobEntity> {
    const instance = this.jobRepo.create(job);

    await this.jobRepo.save(instance, { reload: false });

    return instance;
  }

  @Get(':id')
  getJob(@Param('id') id: string): Promise<JobEntity> {
    return this.jobRepo.findOne(id);
  }

  @Get(':id/task/planned')
  async getTask(@Param('id') id: string): Promise<JobEntity> {
    const job = await this.jobRepo.findOne(id);

    if (job.status === JobStatus.Completed) {
      job.tasks = [];
      return job;
    }

    const tasks = await this.taskRepo.find({
      where: { job: { id } },
    });

    const {
      [JobStatus.Planned]: plannedTasks = [],
      [JobStatus.Running]: runningTasks = [],
      [JobStatus.Completed]: completedTasks = [],
    } = groupBy((task) => task.status, tasks);

    if (plannedTasks.length) {
      const batch = plannedTasks.slice(0, 2);

      batch.forEach((task) => (task.status = JobStatus.Running));

      await this.taskRepo.update(
        batch.map(({ hash }) => hash),
        { status: JobStatus.Running }
      );

      job.tasks = batch;
    } else {
      job.tasks = [];
      if (!plannedTasks.length && !runningTasks.length) {
        const exitCode = completedTasks.find((task) => task.exitCode !== 0)
          ? 1
          : 0;

        await this.jobRepo.update(id, {
          status: JobStatus.Completed,
          exitCode,
        });
        job.status = JobStatus.Completed;
        job.exitCode = exitCode;
      }
    }

    return job;
  }
}
