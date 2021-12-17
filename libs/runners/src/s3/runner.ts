import { DefaultTasksRunnerOptions } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { S3StorageOptions, storageProvider } from './storage';
import { RemoteCache } from '../core/remote-cache';
import { runnerFactory } from '../core/runner-factory';
import { Logger } from '../core/logger';
import { SkipSelf } from 'injection-js';

export interface S3CachingRunnerOptions extends DefaultTasksRunnerOptions {
  remoteCache?: RemoteCache;
  s3: S3StorageOptions;
}

export const s3CachingRunner = runnerFactory<S3CachingRunnerOptions>([
  storageProvider,
  {
    provide: Logger,
    useFactory: (logger: Logger) => logger.scope('nx cloud runner', 's3'),
    deps: [[new SkipSelf(), Logger]],
  },
]);
