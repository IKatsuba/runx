import { Command } from '@oclif/core';
import {
  concatAll,
  defer,
  exhaustMap,
  filter,
  interval,
  last,
  lastValueFrom,
  map,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { Job, JobStatus } from '@runx/nx-runners/src/core/job';
import axios from 'axios';
import { command } from 'execa';
import { getCommandAsString } from '@nrwl/workspace/src/tasks-runner/utils';

export default class NxAgent extends Command {
  static description = 'description';

  async run(): Promise<void> {
    const endGame$ = new Subject<void>();

    const api = axios.create({ baseURL: process.env.NX_CLOUD_API_URL });

    const runner = interval(15_000).pipe(
      exhaustMap(() =>
        defer(() =>
          api.get<Job>(`${process.env.RUNX_JOB_ID}/task/planned`)
        ).pipe(
          map(({ data }) => data),
          tap(({ status }) => {
            if (status === JobStatus.Completed) {
              endGame$.next();
            }
          }),
          filter((job) => job.status !== JobStatus.Completed),
          map(({ tasks }) =>
            tasks.map((task) => defer(() => command(getCommandAsString(task))))
          ),
          concatAll(),
          last(null, null)
        )
      ),
      takeUntil(endGame$)
    );

    await lastValueFrom(runner);
  }
}
