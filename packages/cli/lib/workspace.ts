import { join } from '@std/path/join';
import type { PackageJson } from './graph.ts';
import { logger } from './logger.ts';
import { cacheManager, hashify } from './cache.ts';
import { dirname } from '@std/path/dirname';
import { expandGlob } from '@std/fs/expand-glob';
import { exists } from '@std/fs/exists';
import { parseGitignore } from './gitignore.ts';

export function getWorkspacePatterns(config: PackageJson) {
  return config.workspaces?.map((workspace) =>
    join(workspace, 'package.json')
  ) ?? ['**/package.json'];
}

export async function readRootConfig(): Promise<PackageJson> {
  try {
    return JSON.parse(
      await Deno.readTextFile(join(Deno.cwd(), 'package.json')),
    );
  } catch (_error) {
    const error = new Error('Failed to read root config');

    logger.error(error);
    throw error;
  }
}

export async function getWorkspaceProjects(
  workspacePatterns: string[],
): Promise<Array<{ packageJson: PackageJson; cwd: string }>> {
  const cacheKey = await hashify(JSON.stringify(workspacePatterns));

  // Try to get from cache
  const cachedFiles = cacheManager.getFileSearchCache(cacheKey);
  if (cachedFiles) {
    return Promise.all(
      cachedFiles.map(async (path: string) => ({
        packageJson: JSON.parse(await Deno.readTextFile(path)),
        cwd: dirname(path),
      })),
    );
  }

  const exclude = ['**/node_modules/**'];
  const gitignorePath = join(Deno.cwd(), '.gitignore');

  if (await exists(gitignorePath)) {
    const gitignore = await Deno.readTextFile(gitignorePath);
    exclude.push(
      ...parseGitignore(gitignore),
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
            exclude,
          },
        ),
      )
    ),
  ).then((results) => results.flat());

  // Cache the results
  cacheManager.saveFileSearchCache(
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
