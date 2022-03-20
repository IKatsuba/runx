import {
  Context,
  Job,
  JobStatus,
  JobTask,
} from '@runx/nx-runners/src/core/job';
import { DefaultTasksRunnerOptions } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';

@Entity()
export class JobEntity implements Job {
  @Column('json')
  context: Context;

  @PrimaryColumn()
  id: string;

  @Column('json')
  options: DefaultTasksRunnerOptions;

  @Column({
    type: 'enum',
    enum: [JobStatus.Planned, JobStatus.Running, JobStatus.Completed],
    default: JobStatus.Planned,
  })
  status: JobStatus;

  @OneToMany(() => TaskEntity, (task) => task.job, {
    cascade: true,
  })
  tasks: TaskEntity[];

  @Column({ nullable: true })
  exitCode?: number;
}

@Entity()
export class TaskEntity implements JobTask {
  @PrimaryColumn()
  hash: string;

  @Column('json', { nullable: true })
  hashDetails: {
    command: string;
    nodes: { [p: string]: string };
    implicitDeps: { [p: string]: string };
    runtime: { [p: string]: string };
  };

  @Column()
  id: string;

  @Column('json')
  overrides: any;
  @Column({ nullable: true })
  projectRoot?: string;
  @Column('json')
  target: { project: string; target: string; configuration?: string };

  @Column('enum', {
    enum: [JobStatus.Planned, JobStatus.Running, JobStatus.Completed],
    default: JobStatus.Planned,
  })
  status: JobStatus;

  @ManyToOne(() => JobEntity, (job) => job.tasks)
  job: JobEntity;

  @Column({ nullable: true })
  exitCode: number;

  @Column({ nullable: true })
  executionTime: number;
}
