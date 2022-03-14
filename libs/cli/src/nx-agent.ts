import {
  concatMap,
  defer,
  exhaustMap,
  filter,
  from,
  last,
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

export const api = axios.create({
  baseURL: process.env.NX_CLOUD_API_URL ?? '/',
});

function getIntervalDuration(): number {
  return process.env.RUNX_AGENT_INTERVAL_DURATION
    ? parseInt(process.env.RUNX_AGENT_INTERVAL_DURATION, 10)
    : 15_000;
}

export const nxAgent = timer(0, getIntervalDuration()).pipe(
  exhaustMap(() => {
    return defer<Promise<AxiosResponse<Job>>>(() =>
      api
        .get<Job>(`v1/job/${process.env.RUNX_JOB_ID}/task/planned`)
        .catch(() => null)
    ).pipe(
      filter((data) => !!data),
      map(({ data }) => data),
      tap(({ status }) => {
        if (status === JobStatus.Completed) {
          endGame$.next();
        }
      }),
      filter(({ status }) => status !== JobStatus.Completed),
      concatMap(({ tasks = [] }) => from(tasks.concat().reverse())),
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

        return api
          .post<JobTask>(`v1/task/${task.uuid}`, {
            status: JobStatus.Completed,
            exitCode,
          })
          .then(({ data }) => data);
      }),
      last(null, null)
    );
  }),
  takeUntil(endGame$)
);
