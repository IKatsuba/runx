import { expandGlob } from '@std/fs';
import { Command } from '@cliffy/command';
import { parseFullCommand } from './lib/parse-command.ts';
import { dirname, join } from '@std/path';
import $ from '@david/dax';
import { Graph, type PackageJson } from './lib/graph.ts';
import { getAffectedPackages, getChangedFiles } from './lib/git.ts';

await new Command()
  .name('runx')
  .description('Monorepo CLI')
  .version('v0.1.0')
  .option(
    '-a, --affected [base:string]',
    'Run command only for affected packages',
    (value) => value || value === '',
  )
  .arguments('<task-name> [...project]')
  .action(async ({ affected }, taskName, ...projects: string[]) => {
    const startTime = performance.now();
    console.log(`Running command ${taskName} with options:`, {
      affected,
      projects,
    });

    console.log(`\n> Starting execution of '${taskName}' command...`);

    // Read root package.json to get workspace patterns
    const rootPackageJson = JSON.parse(
      await Deno.readTextFile(join(Deno.cwd(), 'package.json')),
    ) as PackageJson;

    const workspacePatterns = rootPackageJson.workspaces || ['**/package.json'];

    // Collect all package.json files from workspace patterns
    const packageFileSpecs = await Promise.all(
      workspacePatterns.map((pattern) =>
        Array.fromAsync(
          expandGlob(
            pattern.endsWith('package.json')
              ? pattern
              : join(pattern, 'package.json'),
            {
              root: Deno.cwd(),
              exclude: ['**/node_modules/**'],
            },
          ),
        )
      ),
    ).then((results) => results.flat());

    const packageFiles = await Promise.all(
      packageFileSpecs.map(async (spec) => ({
        packageJson: JSON.parse(await Deno.readTextFile(spec.path)),
        cwd: dirname(spec.path),
      })),
    );

    const foundPackagesEndTime = performance.now();
    console.log(
      `✓ Found and parsed ${packageFiles.length} packages in ${
        ((foundPackagesEndTime - startTime) / 1000).toFixed(2)
      }s`,
    );

    // Create packages array for the Graph
    const packages: PackageJson[] = packageFiles.map(({ packageJson }) =>
      packageJson
    );

    // Build dependency graph
    const graph = new Graph(packages);
    await graph.buildGraph();

    const graphEndTime = performance.now();
    console.log(
      `✓ Built dependency graph in ${
        ((graphEndTime - foundPackagesEndTime) / 1000).toFixed(2)
      }s`,
    );

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

    let filteredOrder = executionOrder;

    if (affected) {
      const baseBranch = typeof affected === 'string' ? affected : 'main';
      const changedFiles = await getChangedFiles(baseBranch);
      const affectedPackages = getAffectedPackages(
        changedFiles,
        packageFiles,
      );

      // Get affected packages with their dependents
      const allAffectedPackages = graph.getAffectedPackagesWithDependents(
        affectedPackages,
      );

      console.log('\nAffected packages:');
      console.log(Array.from(allAffectedPackages).join('\n'));

      // Filter execution order to only include affected packages
      filteredOrder = executionOrder.filter((pkg) =>
        allAffectedPackages.has(pkg)
      );
    } else if (projects.length > 0) {
      filteredOrder = executionOrder.filter((pkg) => projects.includes(pkg));
    }

    // Create a map of package names to their file info for easy lookup
    const packageMap = new Map(
      packageFiles.map((pkg) => [pkg.packageJson.name, pkg]),
    );

    const topologicalSortEndTime = performance.now();
    console.log(
      `✓ Topologically sorted ${filteredOrder.length} packages in ${
        ((topologicalSortEndTime - topologicalSortEndTime) / 1000).toFixed(
          2,
        )
      }s`,
    );

    // Execute scripts in order
    for (const packageName of filteredOrder) {
      const packageStartTime = performance.now();
      const packageInfo = packageMap.get(packageName);
      if (!packageInfo) continue;

      const script = packageInfo.packageJson.scripts?.[taskName];
      if (!script) continue;

      console.log(`\n> Executing ${taskName} in ${packageName}...`);

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

          const packageDuration =
            ((performance.now() - packageStartTime) / 1000).toFixed(2);
          console.log(`✓ Finished ${packageName} in ${packageDuration}s`);
        } catch (error) {
          console.error(
            `Failed to execute ${taskName} in ${packageName}:`,
            error,
          );
          Deno.exit(1);
        }
      }
    }

    const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`\n> Total execution time: ${totalDuration}s`);
  })
  .parse(Deno.args);
