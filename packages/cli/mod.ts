import { expandGlob } from '@std/fs';
import { Command } from '@cliffy/command';
import { type CommandSegment, parseFullCommand } from './lib/parse-command.ts';
import { dirname, join } from '@std/path';
import $ from '@david/dax';

await new Command()
  .name('runx')
  .description('Monorepo CLI')
  .version('v0.0.0-development')
  .arguments('<command> [...project]')
  .action(async (flags, command, ...projects: string[]) => {
    const packageFileSpecs = await Array.fromAsync(
      expandGlob('**/package.json', {
        root: Deno.cwd(),
        exclude: ['**/node_modules/**'],
      }),
    );

    const packageFiles = await Promise.all(
      packageFileSpecs.map(async (spec) => ({
        packageJson: JSON.parse(await Deno.readTextFile(spec.path)),
        cwd: dirname(spec.path),
      })),
    );

    const scripts = packageFiles.map((pkg) => ({
      command: pkg.packageJson.scripts?.[command],
      cwd: pkg.cwd,
      name: pkg.packageJson.name,
    }))
      .filter(
        ({ command, name }) =>
          command !== undefined &&
          (projects.length === 0 || projects.includes(name)),
      );

    console.log('scripts', scripts);

    if (scripts.length === 0) {
      console.log(`No scripts found for command "${command}"`);
      return;
    }

    for (const script of scripts) {
      const segments = parseFullCommand(script.command);

      for (const segment of segments) {
        if (typeof segment === 'string') {
          continue;
        }

        const { env, command, args } = segment as CommandSegment;

        const which = (await $.which(command))!;

        const executable = join(Deno.cwd(), which);

        await $`${executable} ${args.join(' ')}`.cwd(
          script.cwd,
        ).env({
          ...Deno.env.toObject(),
          ...(env ?? {}),
        });
      }
    }
  })
  .parse(Deno.args);
