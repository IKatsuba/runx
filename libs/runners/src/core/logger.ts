import { DefaultMethods, Signale } from 'signale';
import { InjectionToken } from 'injection-js';

export abstract class Logger {
  abstract error(message?: any, ...optionalArgs: any[]): void;

  abstract debug(message?: any, ...optionalArgs: any[]): void;

  abstract fatal(message?: any, ...optionalArgs: any[]): void;

  abstract warn(message?: any, ...optionalArgs: any[]): void;

  abstract await(message?: any, ...optionalArgs: any[]): void;

  abstract complete(message?: any, ...optionalArgs: any[]): void;

  abstract fav(message?: any, ...optionalArgs: any[]): void;

  abstract info(message?: any, ...optionalArgs: any[]): void;

  abstract note(message?: any, ...optionalArgs: any[]): void;

  abstract pause(message?: any, ...optionalArgs: any[]): void;

  abstract pending(message?: any, ...optionalArgs: any[]): void;

  abstract star(message?: any, ...optionalArgs: any[]): void;

  abstract start(message?: any, ...optionalArgs: any[]): void;

  abstract success(message?: any, ...optionalArgs: any[]): void;

  abstract wait(message?: any, ...optionalArgs: any[]): void;

  abstract watch(message?: any, ...optionalArgs: any[]): void;

  abstract log(message?: any, ...optionalArgs: any[]): void;

  abstract scope(...scopes: string[]): void;
}

export const LOG_LEVEL = new InjectionToken<string>('LOG_LEVEL');

export const logLevelProvider = {
  provide: LOG_LEVEL,
  useFactory: () => (process.env.DEBUG ? 'info' : 'error'),
};

export const loggerProvider = {
  provide: Logger,
  useFactory: (logLevel: string) =>
    new Signale<DefaultMethods | 'wait'>({
      scope: 'nx cloud runner',
      logLevel,
    }),
  deps: [LOG_LEVEL],
};

export const loggerProviders = [logLevelProvider, loggerProvider];
