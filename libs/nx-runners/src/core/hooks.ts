import { InjectionToken } from 'injection-js';

export const INITIALIZE = new InjectionToken<Array<() => Promise<unknown>>>(
  'initialize'
);

export const COMPLETION = new InjectionToken<Array<() => Promise<unknown>>>(
  'COMPLETION'
);
