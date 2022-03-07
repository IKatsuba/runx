import { Task } from '@nrwl/devkit';
import { InjectionToken } from 'injection-js';

export const TASKS = new InjectionToken<Task[]>('Tasks');
