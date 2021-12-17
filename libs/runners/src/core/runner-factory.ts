import { TasksRunner } from '@nrwl/workspace/src/tasks-runner/tasks-runner';
import { NxJsonConfiguration, ProjectGraph, Task } from '@nrwl/devkit';
import { Provider, ReflectiveInjector } from 'injection-js';
import { RemoteCache, remoteCacheProvider } from './remote-cache';
import {
  defaultTasksRunner,
  DefaultTasksRunnerOptions,
} from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { OPTIONS } from './options';

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
      remoteCacheProvider,
      providers,
    ]);

    return defaultTasksRunner(
      tasks,
      {
        ...options,
        remoteCache: injector.get(RemoteCache, null),
      },
      context
    );
  };
}
