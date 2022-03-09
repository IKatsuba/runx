import { FactoryProvider } from 'injection-js';
import { TASK_RUNNER } from '../core/task-runner';
import { OPTIONS } from '../core/options';
import { TASKS } from '../core/tasks';
import { Context, CONTEXT } from '../core/context';
import { DefaultTasksRunnerOptions } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { Task } from '@nrwl/devkit';
import { Logger } from '../core/logger';
import {
  defer,
  exhaustMap,
  interval,
  lastValueFrom,
  mapTo,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { Api } from './api';
import { CloudTaskStatus } from './cloud-task';

export const cloudTaskRunnerProvider: FactoryProvider = {
  provide: TASK_RUNNER,
  deps: [OPTIONS, TASKS, CONTEXT, Logger, Api],
  useFactory: (
    options: DefaultTasksRunnerOptions,
    tasks: Task[],
    context: Context,
    logger: Logger,
    api: Api
  ) => {
    return () => {
      const endGame$ = new Subject<void>();

      const runner = defer(() => api.createCloudTask(tasks)).pipe(
        switchMap((id) =>
          interval(15_000).pipe(mapTo(id), takeUntil(endGame$))
        ),
        exhaustMap((id) => api.getTaskStatus(id)),
        tap((status) => {
          if (status === CloudTaskStatus.Complete) {
            endGame$.next();
          }
        })
      );

      return lastValueFrom(runner);
    };
  },
};
