import { DefaultTasksRunnerOptions } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { storageProvider } from './storage';
import { RemoteCache } from '../core/remote-cache';
import { runnerFactory } from '../core/runner-factory';
import { Logger } from '../core/logger';
import { SkipSelf } from 'injection-js';
import { OPTIONS } from '../core/options';

export interface CloudRunnerOptions extends DefaultTasksRunnerOptions {
  remoteCache?: RemoteCache;
  apiUrl?: string;
}

export const cloudCachingRunner = runnerFactory<CloudRunnerOptions>([
  {
    provide: OPTIONS,
    useFactory: (options: CloudRunnerOptions) => ({
      ...options,
      apiUrl: options.apiUrl ?? (process.env.NX_CLOUD_API_URL || null),
    }),
    deps: [[new SkipSelf(), OPTIONS]],
  },
  storageProvider,
  {
    provide: Logger,
    useFactory: (logger: Logger) => logger.scope('nx cloud runner', 'cloud'),
    deps: [[new SkipSelf(), Logger]],
  },
]);
