import signale from 'signale';

export class Logger {
  private logger = new signale.Signale({
    scope: 'runx',
    logLevel: 'info',
  });

  raw(...args: unknown[]) {
    Deno.stdout.writeSync(new TextEncoder().encode(args.join(' ')));
  }

  await(...args: unknown[]) {
    this.logger.await(...args);
  }

  complete(...args: unknown[]) {
    this.logger.complete(...args);
  }

  error(...args: unknown[]) {
    this.logger.error(...args);
  }

  debug(...args: unknown[]) {
    this.logger.debug(...args);
  }

  fatal(...args: unknown[]) {
    this.logger.fatal(...args);
  }

  fav(...args: unknown[]) {
    this.logger.fav(...args);
  }

  info(...args: unknown[]) {
    this.logger.info(...args);
  }

  note(...args: unknown[]) {
    this.logger.note(...args);
  }

  pause(...args: unknown[]) {
    this.logger.pause(...args);
  }

  pending(...args: unknown[]) {
    this.logger.pending(...args);
  }

  star(...args: unknown[]) {
    this.logger.star(...args);
  }

  start(...args: unknown[]) {
    this.logger.start(...args);
  }

  success(...args: unknown[]) {
    this.logger.success(...args);
  }

  warn(...args: unknown[]) {
    this.logger.warn(...args);
  }

  watch(...args: unknown[]) {
    this.logger.watch(...args);
  }

  log(...args: unknown[]) {
    this.logger.log(...args);
  }
}
export const logger = new Logger();
