import { Task } from '@nrwl/devkit';
import { LifeCycle } from '../core/life-cycle';
import { performance } from 'perf_hooks';
import { TaskResult } from '@nrwl/workspace/src/tasks-runner/life-cycle';
import { Injectable, Provider } from 'injection-js';
import { Api } from './api';
import { Context, JobTask } from '../core/job';
import { CONTEXT } from '../core/context';
import { unparse } from '@nrwl/workspace/src/tasks-runner/utils';
import { COMPLETION } from '../core/hooks';

@Injectable()
export class CloudLifeCycle implements LifeCycle {
  public timings: Map<string, JobTask> = new Map();

  startTasks(tasks: Task[]): void {
    for (const task of tasks) {
      this.timings.set(task.hash, {
        ...task,
        executionTime: performance.now(),
      });
    }
  }

  endTasks(taskResults: TaskResult[]): void {
    for (const taskResult of taskResults) {
      const data = this.timings.get(taskResult.task.hash);

      if (!data) {
        continue;
      }

      if (['success', 'failure'].includes(taskResult.status)) {
        data.executionTime = performance.now() - data.executionTime;
      } else {
        data.executionTime = 0;
      }
    }
  }
}

export const lifeCycleProvider: Provider[] = [
  {
    provide: COMPLETION,
    multi: true,
    useFactory(lifeCycle: CloudLifeCycle, context: Context, api: Api) {
      return (): Promise<unknown> => {
        const tasks = [...lifeCycle.timings.entries()].map<
          [Record<string, number | string>, number]
        >(([, task]) => {
          const {
            executionTime,
            target: { project, target, configuration },
            overrides,
          } = task;

          const {
            nxJson: { npmScope },
          } = context;

          return [
            {
              overrides: unparse(overrides).join(' '),
              project,
              target,
              configuration,
              npmScope,
            },
            executionTime,
          ];
        });

        return api.sendMetrics(tasks).catch(() => null);
      };
    },
    deps: [LifeCycle, CONTEXT, Api],
  },
  {
    provide: LifeCycle,
    useClass: CloudLifeCycle,
  },
];
