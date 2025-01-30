import { crypto } from '@std/crypto';
import { join } from '@std/path';
import { ensureDir, exists, expandGlob } from '@std/fs';
import type { Graph, PackageJson } from './graph.ts';

interface TaskCache {
  hash: string;
  timestamp: number;
  output: string;
  exitCode: number;
}

// Cache for package hashes during single run
export async function calculateTaskHash(
  packageName: string,
  taskName: string,
  dependencies: {
    files: string[];
    packageJson: PackageJson;
  },
  graph?: Graph,
  packageMap?: Map<string, { packageJson: PackageJson; cwd: string }>,
): Promise<string> {
  // Create a cache key that includes all inputs that might affect the hash

  console.log(`Calculating hash for ${packageName} ${taskName}`);
  console.log(`Package name: ${packageName}`);
  console.log(`Task name: ${taskName}`);

  // Get all local dependencies from the graph
  const localDependencyHashes: string[] = [];
  if (graph && packageMap) {
    const node = graph.getNode(packageName);
    if (node) {
      for (const dep of node.dependencies) {
        if (dep.isLocal) {
          const depInfo = packageMap.get(dep.name);
          if (depInfo) {
            // Get all files for the dependency
            const exclude = [];
            const gitignorePath = join(Deno.cwd(), '.gitignore');

            if (await exists(gitignorePath)) {
              const gitignore = await Deno.readTextFile(gitignorePath);
              exclude.push(
                ...gitignore.split('\n').map((file) => file.trim()).filter(
                  Boolean,
                ),
              );
            }

            const depFiles = await Array.fromAsync(
              expandGlob('**/*', {
                root: depInfo.cwd,
                exclude,
              }),
            ).then((files) =>
              files.map((file) => file.path.replace(Deno.cwd() + '/', ''))
            );

            // Calculate hash for each local dependency with its own files and package.json
            const depHash = await calculateTaskHash(
              dep.name,
              taskName,
              {
                files: depFiles,
                packageJson: depInfo.packageJson,
              },
              graph,
              packageMap,
            );
            localDependencyHashes.push(depHash);
          }
        }
      }
    }
  }

  // Create a string that includes all the inputs that affect the task
  const inputString = JSON.stringify({
    packageName,
    taskName,
    dependencies,
    localDependencyHashes,
  });

  // Calculate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(inputString),
  );

  // Convert to hex string
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  console.log(`Hash for ${packageName} ${taskName}: ${hash}`);

  return hash;
}

export class TaskCacheManager {
  private cacheDir: string;

  constructor(workspaceRoot: string) {
    this.cacheDir = join(workspaceRoot, '.runx', 'cache');
  }

  private getCachePath(hash: string): string {
    return join(this.cacheDir, `${hash}.json`);
  }

  async init(): Promise<void> {
    await ensureDir(this.cacheDir);
  }

  async saveCache(
    hash: string,
    output: string,
    exitCode: number,
  ): Promise<void> {
    const cache: TaskCache = {
      hash,
      timestamp: Date.now(),
      output,
      exitCode,
    };

    await Deno.writeTextFile(
      this.getCachePath(hash),
      JSON.stringify(cache, null, 2),
    );
  }

  async getCache(hash: string): Promise<TaskCache | null> {
    try {
      const cachePath = this.getCachePath(hash);
      const cacheContent = await Deno.readTextFile(cachePath);
      return JSON.parse(cacheContent) as TaskCache;
    } catch {
      return null;
    }
  }
}
