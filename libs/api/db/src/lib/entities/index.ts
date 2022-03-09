import {
  Context,
  ApiHttpJob,
  ApiHttpJobStatus,
} from '@runx/nx-runners/src/core/job';
import { DefaultTasksRunnerOptions } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { Task } from '@nrwl/devkit';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ApiHttpJobEntity implements ApiHttpJob {
  @Column('json')
  context: Context;

  @PrimaryGeneratedColumn()
  id: string;

  @Column('json')
  options: DefaultTasksRunnerOptions;

  @Column({
    type: 'enum',
    enum: ApiHttpJobStatus,
    default: ApiHttpJobStatus.Pending,
  })
  status: ApiHttpJobStatus;

  @OneToMany(() => TaskEntity, (task) => task.job)
  tasks: TaskEntity[];
}

@Entity()
export class TaskEntity implements Task {
  @Column()
  hash: string;
  @Column('json')
  hashDetails: {
    command: string;
    nodes: { [p: string]: string };
    implicitDeps: { [p: string]: string };
    runtime: { [p: string]: string };
  };
  @PrimaryColumn()
  id: string;
  @Column('json')
  overrides: any;
  @Column()
  projectRoot: string;
  @Column('json')
  target: { project: string; target: string; configuration?: string };

  @ManyToOne(() => ApiHttpJobEntity, (job) => job.tasks)
  job: ApiHttpJobEntity;
}
