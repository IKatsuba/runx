import { FactoryProvider, InjectionToken, Optional } from 'injection-js';
import { RemoteCache } from './remote-cache';
import { LifeCycle } from './life-cycle';
import {
  defaultTasksRunner,
  DefaultTasksRunnerOptions,
} from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { CompositeLifeCycle } from '@nrwl/workspace/src/tasks-runner/life-cycle';
import { Task } from '@nrwl/devkit';
import { CONTEXT } from './context';
import { Context } from './job';
import { TASKS } from './tasks';
import { OPTIONS } from './options';

export const TASK_RUNNER = new InjectionToken('Task Runner');

export const defaultTaskRunnerProvider: FactoryProvider = {
  provide: TASK_RUNNER,
  useFactory:
    (
      remoteCache: RemoteCache,
      lifeCycle: LifeCycle,
      options: DefaultTasksRunnerOptions,
      tasks: Task[],
      context: Context
    ) =>
    () => {
      return defaultTasksRunner(
        tasks,
        {
          ...options,
          remoteCache: remoteCache,
          lifeCycle: new CompositeLifeCycle(
            [options.lifeCycle, lifeCycle].filter(Boolean)
          ),
        },
        context
      );
    },
  deps: [
    [new Optional(), RemoteCache],
    [new Optional(), LifeCycle],
    OPTIONS,
    TASKS,
    CONTEXT,
  ],
};
