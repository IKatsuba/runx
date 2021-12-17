import { TasksRunner } from '@nrwl/workspace/src/tasks-runner/tasks-runner';
import { NxJsonConfiguration, ProjectGraph, Task } from '@nrwl/devkit';
import { Provider, ReflectiveInjector } from 'injection-js';
import { RemoteCache, remoteCacheProvider } from './remote-cache';
import {
  defaultTasksRunner,
  DefaultTasksRunnerOptions,
} from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { OPTIONS } from './options';
import { noopStorageProvider } from './storage';
import { LifeCycle, noopLifeCycleProvider } from './life-cycle';
import { CompositeLifeCycle } from '@nrwl/workspace/src/tasks-runner/life-cycle';
import { loggerProvider } from './logger';

export function runnerFactory<T extends DefaultTasksRunnerOptions>(
  providers: Provider[]
): TasksRunner<T> {
  return (
    tasks: Task[],
    options: T,
    context?: {
      target?: string;
      initiatingProject?: string | null;
      projectGraph: ProjectGraph;
      nxJson: NxJsonConfiguration;
    }
  ) => {
    const injector = ReflectiveInjector.resolveAndCreate([
      {
        provide: OPTIONS,
        useValue: options,
      },
      loggerProvider,
      noopStorageProvider,
      noopLifeCycleProvider,
      remoteCacheProvider,
      providers,
    ]);

    return defaultTasksRunner(
      tasks,
      {
        ...options,
        remoteCache: injector.get(RemoteCache, null),
        lifeCycle: new CompositeLifeCycle(
          [options.lifeCycle, injector.get(LifeCycle, null)].filter(Boolean)
        ),
      },
      context
    );
  };
}
