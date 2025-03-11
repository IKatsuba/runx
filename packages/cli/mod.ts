import { exists, expandGlob } from '@std/fs';
import { Command } from '@cliffy/command';
import { parseFullCommand } from './lib/parse-command.ts';
import { dirname, join } from '@std/path';
import $ from '@david/dax';
import { Graph, type PackageJson } from './lib/graph.ts';
import { getAffectedPackages, getChangedFiles } from './lib/git.ts';
import { calculateTaskHash, hashify, initCacheManager } from './lib/cache.ts';
import { logger } from './lib/logger.ts';

const _cacheManager = await initCacheManager(Deno.cwd());

await new Command()
  .name('runx')
  .description('Monorepo CLI')
  .version('v0.2.0')
  .option(
    '-a, --affected [base:string]',
    'Run command only for affected packages',
    {
      value: (value) => value || value === '',
    },
  )
  .option(
    '--cache',
    'Enable task caching',
    { default: false },
  )
  .option(
    '--no-cache',
    'Disable task caching',
    { hidden: true },
  )
  .option(
    '-c, --concurrency [limit:number]',
    'Maximum number of parallel task executions',
    { default: 1 },
  )
  .arguments('<task-name> [...project]')
  .action(
    async (
      { affected, cache, concurrency },
      taskName,
      ...projects: string[]
    ) => {
      const startTime = performance.now();
      logger.info(`Running command ${taskName} with options:`, {
        affected,
        projects,
        cache,
        concurrency,
      });

      logger.info(`> Starting execution of '${taskName}' command...`);

      // Read root package.json to get workspace patterns
      const rootPackageJson = JSON.parse(
        await Deno.readTextFile(join(Deno.cwd(), 'package.json')),
      ) as PackageJson;

      const workspaces = rootPackageJson.workspaces?.map((workspace) =>
        join(workspace, 'package.json')
      );

      const workspacePatterns = workspaces || ['**/package.json'];

      // Initialize cache manager if caching is enabled

      const cacheManager = cache ? _cacheManager : null;
      if (cacheManager) {
        await cacheManager.init();
      }

      // Find all packages using optimized search
      const packageFiles = await findWorkspacePackages(
        workspacePatterns,
      );

      const foundPackagesEndTime = performance.now();
      logger.success(
        `Found and parsed ${packageFiles.length} packages in ${
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
      logger.success(
        `Built dependency graph in ${
          ((graphEndTime - foundPackagesEndTime) / 1000).toFixed(2)
        }s`,
      );

      // Check for circular dependencies
      const cycles = graph.findCircularDependencies();
      if (cycles.length > 0) {
        logger.error('Circular dependencies detected:');
        cycles.forEach((cycle) => {
          logger.error(cycle.join(' -> '));
        });
        Deno.exit(1);
      }

      // Get topologically sorted package names
      const executionOrder = graph.getTopologicalSort();

      let filteredOrder = executionOrder;

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

      logger.info(
        `Affected packages: ${Array.from(allAffectedPackages).join(', ')}`,
      );

      if (affected) {
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
      logger.success(
        `Topologically sorted ${filteredOrder.length} packages in ${
          ((topologicalSortEndTime - topologicalSortEndTime) / 1000).toFixed(
            2,
          )
        }s`,
      );

      // Group packages by their dependency level for parallel execution
      const levels = graph.getLevels(filteredOrder);

      logger.debug(levels);
      // Execute packages level by level with concurrency limit
      for (const level of levels) {
        const levelTasks = level.filter((packageName: string) => {
          const packageInfo = packageMap.get(packageName);
          return packageInfo?.packageJson.scripts?.[taskName];
        });

        if (levelTasks.length === 0) continue;

        logger.info(`Executing level with ${levelTasks.length} packages...`);

        const runningTasks: Array<{
          promise: Promise<void>;
          done: boolean;
          name: string;
        }> = [];
        const errors: Error[] = [];

        for (const packageName of levelTasks) {
          // Wait if we've reached the concurrency limit
          const activeTasks = runningTasks.filter((t) => !t.done);
          if (activeTasks.length >= (concurrency as number)) {
            logger.info(
              `Waiting for tasks to finish. Active tasks: ${
                activeTasks.map((t) => t.name).join(', ')
              }`,
            );
            await Promise.race(
              activeTasks.map((t) => t.promise.catch(() => {})),
            );
            // After a task completes, filter out completed tasks
            for (const task of runningTasks) {
              if (!task.done) {
                try {
                  await Promise.race([task.promise]);
                  task.done = true;
                } catch {
                  task.done = true;
                }
              }
            }
          }

          // Execute the package task
          const packageStartTime = performance.now();
          const packageInfo = packageMap.get(packageName)!;
          const script = packageInfo.packageJson.scripts![taskName];

          const taskPromise = {
            promise: (async () => {
              try {
                logger.info(`> Executing ${taskName} in ${packageName}...`);
                const segments = parseFullCommand(script);

                for (const segment of segments) {
                  if (typeof segment === 'string') continue;

                  const { env, command: cmd, args } = segment;
                  const which = (await $.which(cmd))!;
                  const executable = join(Deno.cwd(), which);

                  // If caching is enabled, try to use cached result
                  if (cacheManager) {
                    const exclude = [];
                    const gitignorePath = join(Deno.cwd(), '.gitignore');

                    if (await exists(gitignorePath)) {
                      const gitignore = await Deno.readTextFile(gitignorePath);
                      exclude.push(
                        ...gitignore.split('\n').map((file) => file.trim())
                          .filter(Boolean),
                      );
                    }

                    const packageFiles = await Array.fromAsync(
                      expandGlob('**/*', {
                        root: packageInfo.cwd,
                        exclude,
                      }),
                    ).then((files) =>
                      files.map((file) =>
                        file.path.replace(Deno.cwd() + '/', '')
                      )
                    );

                    const hash = await calculateTaskHash(
                      packageName,
                      taskName,
                      {
                        files: packageFiles,
                        packageJson: packageInfo.packageJson,
                      },
                      graph,
                      packageMap,
                      allAffectedPackages,
                    );

                    const cache = await cacheManager.getCache(hash);
                    const artifactConfig = packageInfo.packageJson.runx?.tasks
                      ?.[taskName]?.artifacts as string[] | undefined;

                    if (cache) {
                      logger.info(
                        `✓ Using cached result for ${packageName} (hash: ${hash})`,
                      );
                      logger.info(cache.output);

                      const restored = await cacheManager.restoreArtifacts(
                        hash,
                        packageInfo.cwd,
                      );
                      if (restored) {
                        logger.success(
                          `✓ Restored artifacts for ${packageName}`,
                        );
                      }

                      if (cache.exitCode !== 0) {
                        throw new Error(
                          `Task failed with exit code ${cache.exitCode}`,
                        );
                      }
                      continue;
                    }

                    const result = await $`${executable} ${args.join(' ')}`.cwd(
                      packageInfo.cwd,
                    ).env({
                      ...Deno.env.toObject(),
                      ...(env ?? {}),
                    }).stdout('inheritPiped');

                    logger.info(result.stdout);

                    await cacheManager.saveCache(
                      hash,
                      result.stdout,
                      result.code,
                    );

                    if (artifactConfig && result.code === 0) {
                      try {
                        await cacheManager.saveArtifacts(
                          hash,
                          packageInfo.cwd,
                          artifactConfig,
                          {
                            packageName,
                            taskName,
                            timestamp: Date.now(),
                          },
                        );
                        logger.success(
                          `Cached artifacts for ${packageName}`,
                        );
                      } catch (error) {
                        logger.warn(
                          `Failed to cache artifacts for ${packageName}:`,
                          error,
                        );
                      }
                    }

                    if (result.code !== 0) {
                      throw new Error(
                        `Task failed with exit code ${result.code}`,
                      );
                    }
                  } else {
                    await $`${executable} ${args.join(' ')}`.cwd(
                      packageInfo.cwd,
                    ).env({
                      ...Deno.env.toObject(),
                      ...(env ?? {}),
                    });
                  }
                }

                const packageDuration =
                  ((performance.now() - packageStartTime) / 1000).toFixed(2);
                logger.success(
                  `✓ Finished ${packageName} in ${packageDuration}s`,
                );
              } catch (err) {
                if (err instanceof Error) {
                  errors.push(err);
                } else {
                  errors.push(new Error(String(err)));
                }
              }
            })(),
            done: false,
            name: packageName,
          };

          runningTasks.push(taskPromise);
        }

        // Wait for all tasks in the current level to complete
        try {
          await Promise.all(runningTasks.map((t) => t.promise));
        } catch (err) {
          logger.error('One or more tasks failed:');
          for (const err of errors) {
            logger.error(
              err instanceof Error ? err.message : String(err),
            );
          }
          Deno.exit(1);
        }
      }

      const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);
      logger.info(`Total execution time: ${totalDuration}s`);
    },
  )
  .parse(Deno.args);

async function findWorkspacePackages(
  workspacePatterns: string[],
): Promise<Array<{ packageJson: PackageJson; cwd: string }>> {
  const cacheKey = await hashify(JSON.stringify(workspacePatterns));

  // Try to get from cache
  const cachedFiles = _cacheManager.getFileSearchCache(cacheKey);
  if (cachedFiles) {
    return Promise.all(
      cachedFiles.map(async (path: string) => ({
        packageJson: JSON.parse(await Deno.readTextFile(path)),
        cwd: dirname(path),
      })),
    );
  }

  // Find all package.json files
  const packageFileSpecs = await Promise.all(
    workspacePatterns.map((pattern) =>
      Array.fromAsync(
        expandGlob(
          pattern,
          {
            root: Deno.cwd(),
            exclude: ['**/node_modules/**'],
          },
        ),
      )
    ),
  ).then((results) => results.flat());

  // Cache the results
  _cacheManager.saveFileSearchCache(
    cacheKey,
    packageFileSpecs.map((spec) => spec.path),
  );

  return Promise.all(
    packageFileSpecs.map(async (spec) => ({
      packageJson: JSON.parse(await Deno.readTextFile(spec.path)),
      cwd: dirname(spec.path),
    })),
  );
}
