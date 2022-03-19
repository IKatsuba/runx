import { FactoryProvider } from 'injection-js';
import { TASK_RUNNER } from '../core/task-runner';
import { OPTIONS } from '../core/options';
import { TASKS } from '../core/tasks';
import { CONTEXT } from '../core/context';
import { Context, JobStatus } from '../core/job';
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
import { Hasher } from '@nrwl/workspace/src/core/hasher/hasher';

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
    return async () => {
      const endGame$ = new Subject<void>();

      const hasher = new Hasher(context.projectGraph, context.nxJson, options);

      for (const task of tasks) {
        const hash = await hasher.hashTaskWithDepsAndContext(task);

        task.hash = hash.value;
        task.hashDetails = hash.details;
      }

      const runner = defer(() =>
        api.createJob({
          tasks,
          context,
          options,
          id: process.env.RUNX_JOB_ID ?? Math.random().toString(),
        })
      ).pipe(
        switchMap((id) =>
          interval(15_000).pipe(mapTo(id), takeUntil(endGame$))
        ),
        exhaustMap(({ id }) => api.getJob(id)),
        tap(({ status }) => {
          if (status === JobStatus.Completed) {
            endGame$.next();
          }
        })
      );

      const { id } = await lastValueFrom(runner);

      const jobTasks = await api.getJobTasks(id);

      return jobTasks.reduce(
        (result, task) => ({
          ...result,
          [task.id]: task.exitCode === 0 ? 'success' : 'failure',
        }),
        {}
      );
    };
  },
};
