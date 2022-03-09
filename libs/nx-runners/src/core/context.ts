import { NxJsonConfiguration, ProjectGraph } from '@nrwl/devkit';
import { InjectionToken } from 'injection-js';

export interface Context {
  target?: string;
  initiatingProject?: string | null;
  projectGraph: ProjectGraph;
  nxJson: NxJsonConfiguration;
}

export const CONTEXT = new InjectionToken<any>('Context');
