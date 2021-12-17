import {
  LifeCycle as ILifeCycle,
  TaskResult,
} from '@nrwl/workspace/src/tasks-runner/life-cycle';
import { Task } from '@nrwl/devkit';
import { TaskCacheStatus } from '@nrwl/workspace/src/utilities/output';

export abstract class LifeCycle implements ILifeCycle {
  abstract startCommand(): void;

  abstract endCommand(): void;

  abstract scheduleTask(task: Task): void;

  abstract startTasks(task: Task[]): void;

  abstract endTasks(taskResults: TaskResult[]): void;

  abstract printTaskTerminalOutput(
    task: Task,
    cacheStatus: TaskCacheStatus,
    output: string
  ): void;
}

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */
export class NoopLifeCycle extends LifeCycle {
  endCommand(): void {}

  endTasks(taskResults: TaskResult[]): void {}

  printTaskTerminalOutput(
    task: Task,
    cacheStatus: TaskCacheStatus,
    output: string
  ): void {}

  scheduleTask(task: Task): void {}

  startCommand(): void {}

  startTasks(task: Task[]): void {}
}

/* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */

export const noopLifeCycleProvider = {
  provide: LifeCycle,
  useClass: NoopLifeCycle,
};
