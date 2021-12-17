import { DefaultMethods, Signale } from 'signale';

export const logger = new Signale<DefaultMethods | 'wait'>({
  scope: 'nx cloud runner',
  logLevel: process.env.DEBUG ? 'info' : 'error',
});

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
}

export const loggerProvider = {
  provide: Logger,
  useValue: logger,
};
