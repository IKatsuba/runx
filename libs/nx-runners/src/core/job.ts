import { NxJsonConfiguration, ProjectGraph, Task } from '@nrwl/devkit';
import { DefaultTasksRunnerOptions } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';

export const enum JobStatus {
  Planned,
  Running,
  Completed,
}

export interface Context {
  target?: string;
  initiatingProject?: string | null;
  projectGraph: ProjectGraph;
  nxJson: NxJsonConfiguration;
}

export interface JobTask extends Task {
  uuid?: string;
  exitCode?: number;
}

export interface Job {
  id: string;
  status: JobStatus;
  tasks: JobTask[];
  options: DefaultTasksRunnerOptions;
  context: Context;
}
