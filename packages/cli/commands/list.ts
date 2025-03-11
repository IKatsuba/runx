import { Command } from '@cliffy/command';

export const listCommand = new Command()
  .description('List all packages')
  .action(async () => {});
