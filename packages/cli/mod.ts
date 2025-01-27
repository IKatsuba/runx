import { expandGlob } from '@std/fs';
import { Command } from '@cliffy/command';
import { parseFullCommand } from './lib/parse-command.ts';
import { dirname, join } from '@std/path';
import $ from '@david/dax';
import { Graph, type PackageJson } from './lib/graph.ts';

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

    // Create packages array for the Graph
    const packages: PackageJson[] = packageFiles.map(({ packageJson }) =>
      packageJson
    );

    // Build dependency graph
    const graph = new Graph(packages);
    await graph.buildGraph();

    // Check for circular dependencies
    const cycles = graph.findCircularDependencies();
    if (cycles.length > 0) {
      console.error('Circular dependencies detected:');
      cycles.forEach((cycle) => {
        console.error(cycle.join(' -> '));
      });
      Deno.exit(1);
    }

    // Get topologically sorted package names
    const executionOrder = graph.getTopologicalSort();

    // Filter packages based on provided projects if any
    const filteredOrder = projects.length > 0
      ? executionOrder.filter((pkg) => projects.includes(pkg))
      : executionOrder;

    // Create a map of package names to their file info for easy lookup
    const packageMap = new Map(
      packageFiles.map((pkg) => [pkg.packageJson.name, pkg]),
    );

    // Execute scripts in order
    for (const packageName of filteredOrder) {
      const packageInfo = packageMap.get(packageName);
      if (!packageInfo) continue;

      const script = packageInfo.packageJson.scripts?.[command];
      if (!script) continue;

      console.log(`\nExecuting ${command} in ${packageName}...`);

      const segments = parseFullCommand(script);

      for (const segment of segments) {
        if (typeof segment === 'string') {
          continue;
        }

        const { env, command: cmd, args } = segment;
        const which = (await $.which(cmd))!;
        const executable = join(Deno.cwd(), which);

        try {
          await $`${executable} ${args.join(' ')}`.cwd(
            packageInfo.cwd,
          ).env({
            ...Deno.env.toObject(),
            ...(env ?? {}),
          });
        } catch (error) {
          console.error(
            `Failed to execute ${command} in ${packageName}:`,
            error,
          );
          Deno.exit(1);
        }
      }
    }
  })
  .parse(Deno.args);
