import { TasksRunner } from '@nrwl/workspace/src/tasks-runner/tasks-runner';
import { Task } from '@nrwl/devkit';
import { Provider, ReflectiveInjector } from 'injection-js';
import { remoteCacheProvider } from './remote-cache';
import { DefaultTasksRunnerOptions } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { OPTIONS } from './options';
import { noopStorageProvider } from './storage';
import { noopLifeCycleProvider } from './life-cycle';
import { loggerProviders } from './logger';
import { TASKS } from './tasks';
import { INITIALIZE } from './hooks';
import { defaultTaskRunnerProvider, TASK_RUNNER } from './task-runner';
import { CONTEXT, Context } from './context';

export function runnerFactory<T extends DefaultTasksRunnerOptions>(
  providers: Provider[]
): TasksRunner<T> {
  return (tasks: Task[], options: T, context?: Context) => {
    const rootInjector = ReflectiveInjector.resolveAndCreate([
      {
        provide: OPTIONS,
        useValue: options,
      },
      {
        provide: TASKS,
        useValue: tasks,
      },
      {
        provide: CONTEXT,
        useValue: context,
      },
      loggerProviders,
      noopStorageProvider,
      noopLifeCycleProvider,
    ]);

    const runnerInjector = ReflectiveInjector.resolveAndCreate(
      [defaultTaskRunnerProvider, providers, remoteCacheProvider],
      rootInjector
    );

    return Promise.all(runnerInjector.get(INITIALIZE, [])).then<any>(
      runnerInjector.get(TASK_RUNNER)
    );
  };
}
