import { DefaultTasksRunnerOptions } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { storageProvider } from './storage';
import { RemoteCache } from '../core/remote-cache';
import { runnerFactory } from '../core/runner-factory';
import { Logger } from '../core/logger';
import { SkipSelf } from 'injection-js';
import { OPTIONS } from '../core/options';
import { cloudTaskRunnerProvider } from './task-runner';
import { DISTRIBUTED_EXECUTION_IS_ENABLED } from './distributed-execution';
import { Api, axiosProvider } from './api';
import { lifeCycleProvider } from './life-cycle';

export interface CloudRunnerOptions extends DefaultTasksRunnerOptions {
  remoteCache?: RemoteCache;
  apiUrl?: string;
  accessToken?: string;
}

export const distributedExecutionIsEnabled =
  process.env.NX_CLOUD_DISTRIBUTED_EXECUTION === 'true';

export const cloudCachingRunner = runnerFactory<CloudRunnerOptions>([
  {
    provide: OPTIONS,
    useFactory: (options: CloudRunnerOptions) => ({
      ...options,
      apiUrl: options.apiUrl ?? (process.env.NX_CLOUD_API_URL || null),
      accessToken:
        options.apiUrl ?? (process.env.NX_CLOUD_ACCESS_TOKEN || null),
    }),
    deps: [[new SkipSelf(), OPTIONS]],
  },
  storageProvider,
  {
    provide: Logger,
    useFactory: (logger: Logger) => logger.scope('runx/nx-runners', 'cloud'),
    deps: [[new SkipSelf(), Logger]],
  },
  {
    provide: DISTRIBUTED_EXECUTION_IS_ENABLED,
    useValue: distributedExecutionIsEnabled,
  },
  distributedExecutionIsEnabled ? cloudTaskRunnerProvider : [],
  axiosProvider,
  Api,
  lifeCycleProvider,
]);
