import { join } from '@std/path/join';
import { parseProject, type Project } from './graph.ts';
import { cacheManager, hashify } from './cache.ts';
import { expandGlob } from '@std/fs/expand-glob';
import { exists } from '@std/fs/exists';
import { parseGitignore } from './gitignore.ts';

export function getWorkspacePatterns(config: Project) {
  return config.workspace?.map((
    workspace,
  ) => [join(workspace, 'package.json'), join(workspace, 'deno.json')])
    .flat() ?? ['**/package.json', '**/deno.json'];
}

export function readRootConfig(): Promise<Project> {
  return parseProject(Deno.cwd());
}

export async function getWorkspaceProjects(
  workspacePatterns: string[],
): Promise<Array<Project>> {
  const cacheKey = await hashify(JSON.stringify(workspacePatterns));

  // Try to get from cache
  const cachedFiles = cacheManager.getFileSearchCache(cacheKey);
  if (cachedFiles) {
    return Promise.all(
      cachedFiles.map((path) => parseProject(path)),
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

  // Find all package.json and deno.json files
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
    packageFileSpecs.map((spec) => parseProject(spec.path)),
  );
}
