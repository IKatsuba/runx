import {
  concatMap,
  defer,
  exhaustMap,
  filter,
  from,
  last,
  lastValueFrom,
  map,
  Subject,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import axios, { AxiosResponse } from 'axios';
import { Job, JobStatus, JobTask } from '@runx/nx-runners/src/core/job';
import { command } from 'execa';
import { getCommandAsString } from '@nrwl/workspace/src/tasks-runner/utils';

const endGame$ = new Subject<void>();

const api = axios.create({ baseURL: process.env.NX_CLOUD_API_URL });

const runner = timer(0, 15_000).pipe(
  exhaustMap(() =>
    defer<Promise<AxiosResponse<Job>>>(() =>
      api
        .get<Job>(`job/${process.env.RUNX_JOB_ID}/task/planned`)
        .catch(() => null)
    ).pipe(
      filter((data) => !!data),
      map(({ data }) => data),
      tap(({ status }) => {
        if (status === JobStatus.Completed) {
          endGame$.next();
        }
      }),
      filter((job) => job.status !== JobStatus.Completed),
      concatMap(({ tasks }) => from(tasks.concat().reverse())),
      concatMap(async (task) => {
        let exitCode: number;

        try {
          const result = await command(getCommandAsString(task), {
            stdio: 'inherit',
          });

          exitCode = result.exitCode;
        } catch (e) {
          exitCode = e.exitCode || 1;
        }

        return api.post<JobTask>(`task/${task.uuid}`, {
          status: JobStatus.Completed,
          exitCode,
        });
      }),
      last(null, null)
    )
  ),
  takeUntil(endGame$)
);

lastValueFrom(runner, { defaultValue: undefined });
