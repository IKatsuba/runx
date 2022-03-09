import { NxJsonConfiguration, ProjectGraph, Task } from '@nrwl/devkit';
import { DefaultTasksRunnerOptions } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';

export enum ApiHttpJobStatus {
  Pending,
  Complete,
}

export interface Context {
  target?: string;
  initiatingProject?: string | null;
  projectGraph: ProjectGraph;
  nxJson: NxJsonConfiguration;
}

export interface ApiHttpJob {
  id: string;
  status: ApiHttpJobStatus;
  tasks: Task[];
  options: DefaultTasksRunnerOptions;
  context: Context;
}
