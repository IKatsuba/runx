import { crypto } from '@std/crypto';
import { join } from '@std/path';
import { ensureDir } from '@std/fs';

interface TaskCache {
  hash: string;
  timestamp: number;
  output: string;
  exitCode: number;
}

export async function calculateTaskHash(
  packageName: string,
  taskName: string,
  dependencies: {
    files: string[];
    packageJson: Record<string, unknown>;
  },
): Promise<string> {
  console.log(`Calculating hash for ${packageName} ${taskName}`);

  console.log(`Package name: ${packageName}`);
  console.log(`Task name: ${taskName}`);
  console.log(`Dependencies: ${JSON.stringify(dependencies)}`);

  // Create a string that includes all the inputs that affect the task
  const inputString = JSON.stringify({
    packageName,
    taskName,
    dependencies,
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
