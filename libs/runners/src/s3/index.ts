import { TasksRunner } from '@nrwl/workspace/src/tasks-runner/tasks-runner';
import {
  defaultTasksRunner,
  DefaultTasksRunnerOptions,
} from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { NxJsonConfiguration, ProjectGraph, Task } from '@nrwl/devkit';
import { S3Cache } from './s3-cache';
import { S3StorageOptions } from './s3-storage';

export interface S3CachingRunnerOptions
  extends Omit<DefaultTasksRunnerOptions, 'remoteCache'> {
  remoteCache: S3Cache;
  s3: S3StorageOptions;
}

export const s3CachingRunner: TasksRunner<S3CachingRunnerOptions> = (
  tasks: Task[],
  options: S3CachingRunnerOptions,
  context?: {
    target?: string;
    initiatingProject?: string | null;
    projectGraph: ProjectGraph;
    nxJson: NxJsonConfiguration;
  }
) => {
  return defaultTasksRunner(
    tasks,
    { ...options, remoteCache: options.s3 ? new S3Cache(options.s3) : null },
    context
  );
};
