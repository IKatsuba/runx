import { crypto } from '@std/crypto';
import { dirname, join } from '@std/path';
import { copy, ensureDir, exists, expandGlob } from '@std/fs';
import type { Graph, PackageJson } from './graph.ts';

interface TaskCache {
  hash: string;
  timestamp: number;
  output: string;
  exitCode: number;
}

interface HashCache {
  hash: string;
  timestamp: number;
  inputs: {
    packageName: string;
    taskName: string;
    dependencies: {
      files: string[];
      packageJson: PackageJson;
    };
    localDependencyHashes: string[];
  };
}

interface TaskArtifact {
  hash: string;
  timestamp: number;
  paths: string[];
  metadata?: Record<string, unknown>;
}

// Cache for package hashes during single run
const hashCache = new Map<string, string>();

export class TaskCacheManager {
  private cacheDir: string;
  private hashCacheDir: string;
  private artifactsDir: string;

  constructor(workspaceRoot: string) {
    this.cacheDir = join(workspaceRoot, '.runx', 'cache');
    this.hashCacheDir = join(workspaceRoot, '.runx', 'hash-cache');
    this.artifactsDir = join(workspaceRoot, '.runx', 'artifacts');
  }

  private getCachePath(hash: string): string {
    return join(this.cacheDir, `${hash}.json`);
  }

  private getHashCachePath(cacheKey: string): string {
    return join(this.hashCacheDir, `${cacheKey}.json`);
  }

  private getArtifactPath(hash: string): string {
    return join(this.artifactsDir, hash);
  }

  async init(): Promise<void> {
    await ensureDir(this.cacheDir);
    await ensureDir(this.hashCacheDir);
    await ensureDir(this.artifactsDir);
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

  async saveHashCache(
    cacheKey: string,
    hash: string,
    inputs: HashCache['inputs'],
  ): Promise<void> {
    const cache: HashCache = {
      hash,
      timestamp: Date.now(),
      inputs,
    };

    await Deno.writeTextFile(
      this.getHashCachePath(cacheKey),
      JSON.stringify(cache, null, 2),
    );
  }

  async getHashCache(cacheKey: string): Promise<HashCache | null> {
    try {
      const cachePath = this.getHashCachePath(cacheKey);
      const cacheContent = await Deno.readTextFile(cachePath);
      return JSON.parse(cacheContent) as HashCache;
    } catch {
      return null;
    }
  }

  async saveArtifacts(
    hash: string,
    cwd: string,
    artifactPaths: string[],
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const artifactDir = this.getArtifactPath(hash);
    await ensureDir(artifactDir);

    const artifact: TaskArtifact = {
      hash,
      timestamp: Date.now(),
      paths: [],
      metadata,
    };

    for (const sourcePath of artifactPaths) {
      const files = await Array.fromAsync(
        expandGlob(sourcePath, {
          root: cwd,
        }),
      );

      for (const file of files) {
        const relativePath = file.path.replace(cwd, '');
        const targetPath = join(artifactDir, relativePath);
        await ensureDir(dirname(targetPath));
        await copy(file.path, targetPath, { overwrite: true });
        artifact.paths.push(relativePath);
      }
    }

    await Deno.writeTextFile(
      join(artifactDir, 'artifact.json'),
      JSON.stringify(artifact, null, 2),
    );
  }

  async getArtifacts(hash: string): Promise<TaskArtifact | null> {
    try {
      const artifactDir = this.getArtifactPath(hash);
      const artifactMetaPath = join(artifactDir, 'artifact.json');
      const artifactContent = await Deno.readTextFile(artifactMetaPath);
      return JSON.parse(artifactContent) as TaskArtifact;
    } catch {
      return null;
    }
  }

  async restoreArtifacts(hash: string, targetDir: string): Promise<boolean> {
    const artifacts = await this.getArtifacts(hash);
    if (!artifacts) {
      return false;
    }

    const artifactDir = this.getArtifactPath(hash);
    await ensureDir(targetDir);

    for (const fileName of artifacts.paths) {
      const sourcePath = join(artifactDir, fileName);
      const targetPath = join(targetDir, fileName);
      await ensureDir(dirname(targetPath));
      await copy(sourcePath, targetPath, { overwrite: true });
    }

    return true;
  }
}

// Global instance of TaskCacheManager
export let cacheManager: TaskCacheManager | null = null;

export async function initCacheManager(
  workspaceRoot: string,
): Promise<TaskCacheManager> {
  cacheManager = new TaskCacheManager(workspaceRoot);

  await cacheManager.init();

  return cacheManager;
}

export async function calculateTaskHash(
  packageName: string,
  taskName: string,
  dependencies: {
    files: string[];
    packageJson: PackageJson;
  },
  graph?: Graph,
  packageMap?: Map<string, { packageJson: PackageJson; cwd: string }>,
  affectedPackages?: Set<string>,
): Promise<string> {
  if (!cacheManager) {
    throw new Error(
      'Cache manager not initialized. Call initCacheManager first.',
    );
  }

  // Skip cache if package is affected
  const isAffected = affectedPackages?.has(packageName);

  // Create a cache key for the current task
  const cacheKey = await hashify(
    `${packageName}:${taskName}:${JSON.stringify(dependencies)}`,
  );

  if (isAffected) {
    console.log(`Skipping cache for affected package ${packageName}`);
  } else {
    // Check memory cache first
    const memCachedHash = hashCache.get(cacheKey);
    if (memCachedHash) {
      console.log(
        `Using memory cached hash for ${packageName} ${taskName}: ${memCachedHash}`,
      );
      return memCachedHash;
    }

    // Check disk cache
    const diskCache = await cacheManager.getHashCache(cacheKey);
    if (diskCache) {
      console.log(
        `Using disk cached hash for ${packageName} ${taskName}: ${diskCache.hash}`,
      );
      // Store in memory cache for future use
      hashCache.set(cacheKey, diskCache.hash);
      return diskCache.hash;
    }
  }

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

            // Pass affected packages to recursive calls
            const depHash = await calculateTaskHash(
              dep.name,
              taskName,
              {
                files: depFiles,
                packageJson: depInfo.packageJson,
              },
              graph,
              packageMap,
              affectedPackages,
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

  // Convert to hex string
  const hash = await hashify(inputString);

  console.log(`Hash for ${packageName} ${taskName}: ${hash}`);

  // Store the calculated hash in both memory and disk cache
  hashCache.set(cacheKey, hash);
  await cacheManager.saveHashCache(cacheKey, hash, {
    packageName,
    taskName,
    dependencies,
    localDependencyHashes,
  });

  return hash;
}

async function hashify(input: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  );

  // Convert to hex string
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hash;
}
