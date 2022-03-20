import { InjectionToken } from 'injection-js';
import { Context } from './job';

export const CONTEXT = new InjectionToken<Context>('Context');
