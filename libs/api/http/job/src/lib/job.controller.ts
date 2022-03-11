import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JobEntity, TaskEntity } from '@runx/api/db';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '@runx/nx-runners/src/core/job';

@Controller()
export class JobController {
  constructor(
    @InjectRepository(JobEntity) private jobRepo: Repository<JobEntity>,
    @InjectRepository(TaskEntity) private taskRepo: Repository<TaskEntity>
  ) {}

  @Post('job')
  async createJob(@Body() job: Job): Promise<JobEntity> {
    const instance = this.jobRepo.create(job);

    await this.jobRepo.save(instance, { reload: false });

    return instance;
  }

  @Get('job/:id')
  getJob(@Param(':id') id: string): Promise<JobEntity> {
    return this.jobRepo.findOne(id);
  }

  @Get('job/:id/task/planned')
  async getTask(@Param('id') id: string): Promise<JobEntity> {
    const job = await this.jobRepo.findOne(id);

    if (job.status === JobStatus.Completed) {
      job.tasks = [];
      return job;
    }

    job.tasks = await this.taskRepo.find({
      skip: 0,
      take: 2,
      where: {
        job: { id },
        status: JobStatus.Planned,
      },
    });

    if (job.tasks.length) {
      job.tasks.forEach((task) => (task.status = JobStatus.Running));

      await this.taskRepo.update(
        job.tasks.map(({ uuid }) => uuid),
        { status: JobStatus.Running }
      );
    } else {
      const tasks = await this.taskRepo.find({
        where: { job: { id } },
      });

      if (
        !tasks.find((task) =>
          [JobStatus.Planned, JobStatus.Running].includes(task.status)
        )
      ) {
        const exitCode = tasks.find((task) => task.exitCode !== 0) ? 1 : 0;

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

  // @Post(':jobId/task/complete')
  // async updateTask(
  //   @Param('jobId') jobId: string,
  //   @Body() taskIds: string[]
  // ): Promise<JobEntity> {
  //   await this.taskRepo.update(taskIds, { status: JobStatus.Completed });
  //
  //   const job = await this.jobRepo
  //     .createQueryBuilder('job')
  //     .whereInIds(jobId)
  //     .leftJoinAndSelect('job.tasks', 'task', 'task.status != :status', {
  //       status: JobStatus.Completed,
  //     })
  //     .getOne();
  //
  //   if (job.status !== JobStatus.Completed && !job.tasks.length) {
  //     await this.jobRepo.update(job.id, { status: JobStatus.Completed });
  //     job.status = JobStatus.Completed;
  //   }
  //
  //   return job;
  // }

  @Post('task/:taskId')
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() task: TaskEntity
  ): Promise<TaskEntity> {
    await this.taskRepo.update(taskId, task);

    return this.taskRepo.findOne(taskId);
  }
}
