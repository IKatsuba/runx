import {
  LifeCycle as ILifeCycle,
  TaskMetadata,
  TaskResult,
} from '@nrwl/workspace/src/tasks-runner/life-cycle';
import { Task } from '@nrwl/devkit';
import { TaskStatus } from '@nrwl/workspace/src/tasks-runner/tasks-runner';

export abstract class LifeCycle
  implements Omit<ILifeCycle, 'startTask' | 'endTask'>
{
  abstract startCommand?(): void;

  abstract endCommand?(): void;

  abstract scheduleTask?(task: Task): void;

  abstract startTasks?(tasks: Task[]): void;

  abstract endTasks?(taskResults: TaskResult[], metadata: TaskMetadata): void;

  abstract printTaskTerminalOutput?(
    task: Task,
    cacheStatus: TaskStatus,
    output: string
  ): void;
}

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */
export class NoopLifeCycle extends LifeCycle {
  endCommand(): void {}

  endTasks(taskResults: TaskResult[]): void {}

  printTaskTerminalOutput(
    task: Task,
    cacheStatus: TaskStatus,
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
