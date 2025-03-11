import $ from '@david/dax';
import { join } from '@std/path';
import { logger } from './logger.ts';
import type { Project } from './graph.ts';

export async function getChangedFiles(baseBranch = 'main'): Promise<string[]> {
  try {
    // Get the merge base commit
    const mergeBase = await $`git merge-base ${baseBranch} HEAD`.text();

    // Get changed files between merge-base and current HEAD
    const diffOutput = await $`git diff --name-only ${mergeBase.trim()} HEAD`
      .text();

    // Get uncommitted changes
    const untrackedOutput = await $`git ls-files --others --exclude-standard`
      .text();
    const modifiedOutput = await $`git diff --name-only`.text();
    // Get staged files
    const stagedOutput = await $`git diff --name-only --cached`.text();

    // Combine all changes and remove duplicates
    const allFiles = [
      ...diffOutput.split('\n'),
      ...untrackedOutput.split('\n'),
      ...modifiedOutput.split('\n'),
      ...stagedOutput.split('\n'),
    ];

    return [...new Set(allFiles)]
      .filter(Boolean)
      .map((file) => file.trim());
  } catch (err) {
    logger.error(
      'Error getting changed files:',
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

export function getAffectedPackages(
  changedFiles: string[],
  packages: Project[],
): Set<string> {
  const affectedPackages = new Set<string>();

  for (const pkg of packages) {
    const packagePath = pkg.path;

    // Check if any changed file is within this package's directory
    const isAffected = changedFiles.some((file) =>
      join(Deno.cwd(), file).startsWith(packagePath)
    );

    if (isAffected) {
      affectedPackages.add(pkg.name);
    }
  }

  return affectedPackages;
}
