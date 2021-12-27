import { DefaultTasksRunnerOptions } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { FirebaseStorageOptions, storageProvider } from './storage';
import { RemoteCache } from '../core/remote-cache';
import { runnerFactory } from '../core/runner-factory';
import { Logger } from '../core/logger';
import { SkipSelf } from 'injection-js';

export interface FirebaseCachingRunnerOptions
  extends DefaultTasksRunnerOptions {
  remoteCache?: RemoteCache;
  firebase: FirebaseStorageOptions;
}

export const firebaseCachingRunner =
  runnerFactory<FirebaseCachingRunnerOptions>([
    storageProvider,
    {
      provide: Logger,
      useFactory: (logger: Logger) =>
        logger.scope('nx cloud runner', 'firebase'),
      deps: [[new SkipSelf(), Logger]],
    },
  ]);
