import { FactoryProvider } from 'injection-js';
import { TASK_RUNNER } from '../core/task-runner';
import { OPTIONS } from '../core/options';
import { TASKS } from '../core/tasks';
import { CONTEXT } from '../core/context';
import { Context, ApiHttpJobStatus } from '../core/job';
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

      const runner = defer(() =>
        api.createJob({ tasks, context, options })
      ).pipe(
        switchMap((id) =>
          interval(15_000).pipe(mapTo(id), takeUntil(endGame$))
        ),
        exhaustMap(({ id }) => api.getJob(id)),
        tap(({ status }) => {
          if (status === ApiHttpJobStatus.Complete) {
            endGame$.next();
          }
        })
      );

      return lastValueFrom(runner);
    };
  },
};
