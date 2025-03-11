import { join } from '@std/path/join';
import { exists } from '@std/fs/exists';
import { dirname } from '@std/path/dirname';

export interface RunxConfig {
  tasks?: {
    [taskName: string]: {
      artifacts: string[];
    };
  };
}

export interface PackageJson {
  name: string;
  version?: string;
  private?: boolean;
  workspaces?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  runx?: RunxConfig;
}

export interface DenoJson {
  name?: string;
  tasks: Record<
    string,
    {
      command: string;
    } | string
  >;
  imports?: Record<string, string>;
  runx?: RunxConfig;
}

export interface ProjectTask {
  name: string;
  runCommand: string[];
  script: string;
}

export interface Project {
  path: string;
  name: string;
  dependencies: Record<string, string>;
  tasks: Record<string, ProjectTask>;
  version?: string;
  workspace?: string[];
  runx?: RunxConfig;
}

export interface DependencyNode {
  name: string;
  version: string;
  dependencies: DependencyNode[];
  isLocal: boolean; // Флаг для определения локального пакета
}

export async function parseProject(path: string): Promise<Project> {
  const isFile = path.endsWith('.json');

  const dir = isFile ? dirname(path) : path;
  const packagePath = isFile ? path : join(dir, 'package.json');
  const denoPath = isFile ? path : join(dir, 'deno.json');

  const denoExists = await exists(denoPath, { isFile: true });
  const packageJsonExists = await exists(packagePath, { isFile: true });

  const packageJson = packageJsonExists
    ? JSON.parse(
      Deno.readTextFileSync(packagePath),
    ) as PackageJson
    : undefined;
  const denoJson = denoExists
    ? JSON.parse(Deno.readTextFileSync(denoPath)) as DenoJson
    : undefined;

  return {
    path: dir,
    name: denoJson?.name ?? packageJson?.name ?? path,
    version: packageJson?.version ?? denoJson?.name ?? '0.0.0-local',
    dependencies: {
      ...(packageJson?.dependencies ?? {}),
      ...(packageJson?.devDependencies ?? {}),
      ...(denoJson?.imports ?? {}),
    },
    tasks: Object.fromEntries(
      [
        ...Object.entries(packageJson?.scripts ?? {}).map((
          [name, script],
        ) => [name, {
          name,
          runCommand: ['npm', 'run', '--silent'],
          script,
        }]),
        ...Object.entries(denoJson?.tasks ?? {}).map(([name, task]) => [name, {
          name,
          runCommand: ['deno', 'task'],
          script: typeof task === 'string' ? task : task.command,
        }]),
      ],
    ),
    runx: {
      ...(packageJson?.runx ?? {}),
      ...(denoJson?.runx ?? {}),
    },
  };
}

export class Graph {
  private nodes: Map<string, DependencyNode> = new Map();
  private localPackages: Map<string, Project> = new Map();
  private edges: Map<string, Set<string>> = new Map();
  private reverseEdges: Map<string, Set<string>> = new Map();

  constructor(packages: Project[]) {
    // Инициализируем карту локальных пакетов
    packages.forEach((pkg) => {
      this.localPackages.set(pkg.name, pkg);
    });
  }

  getNode(packageName: string): DependencyNode | undefined {
    return this.nodes.get(packageName);
  }

  async buildGraph(): Promise<DependencyNode[]> {
    this.nodes.clear();

    // Создаем узлы для всех локальных пакетов
    const rootNodes: DependencyNode[] = [];
    for (const pkg of this.localPackages.values()) {
      const node = await this.createNode(pkg);
      rootNodes.push(node);
    }

    return rootNodes;
  }

  private async createNode(project: Project): Promise<DependencyNode> {
    const nodeKey = project.name;

    // Проверяем, не создавали ли мы уже этот узел
    if (this.nodes.has(nodeKey)) {
      return this.nodes.get(nodeKey)!;
    }

    const node: DependencyNode = {
      name: project.name,
      version: project.version ?? '0.0.0-local',
      dependencies: [],
      isLocal: true,
    };

    // Сохраняем узел в кэш
    this.nodes.set(nodeKey, node);

    // Инициализируем edges для этого пакета
    if (!this.edges.has(nodeKey)) {
      this.edges.set(nodeKey, new Set());
    }
    if (!this.reverseEdges.has(nodeKey)) {
      this.reverseEdges.set(nodeKey, new Set());
    }

    for (
      const depName of Object.keys(project.dependencies)
    ) {
      // Проверяем, является ли зависимость локальным пакетом
      const localDep = this.localPackages.get(depName);

      if (localDep) {
        // Если это локальный пакет, создаем для него узел
        const childNode = await this.createNode(localDep);
        node.dependencies.push(childNode);

        // Добавляем ребро в граф
        this.edges.get(nodeKey)!.add(depName);
        if (!this.reverseEdges.has(depName)) {
          this.reverseEdges.set(depName, new Set());
        }
        this.reverseEdges.get(depName)!.add(nodeKey);
      }
    }

    return node;
  }

  // Вспомогательные методы для анализа графа
  findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (node: DependencyNode) => {
      if (path.includes(node.name)) {
        const cycle = path.slice(path.indexOf(node.name));
        cycles.push([...cycle, node.name]);
        return;
      }

      if (visited.has(node.name)) return;

      visited.add(node.name);
      path.push(node.name);

      for (const dep of node.dependencies) {
        dfs(dep);
      }

      path.pop();
    };

    this.nodes.forEach((node) => {
      dfs(node);
    });

    return cycles;
  }

  getTopologicalSort(): string[] {
    const visited = new Set<string>();
    const sorted: string[] = [];

    const visit = (node: DependencyNode) => {
      if (visited.has(node.name)) return;

      visited.add(node.name);

      for (const dep of node.dependencies) {
        visit(dep);
      }

      sorted.push(node.name);
    };

    this.nodes.forEach((node) => {
      visit(node);
    });

    return sorted;
  }

  getAffectedPackagesWithDependents(
    affectedPackages: Set<string>,
  ): Set<string> {
    const result = new Set<string>();

    const findDependents = (packageName: string) => {
      result.add(packageName);

      this.nodes.forEach((node) => {
        if (node.dependencies.some((dep) => dep.name === packageName)) {
          findDependents(node.name);
        }
      });
    };

    affectedPackages.forEach((pkg) => {
      findDependents(pkg);
    });

    return result;
  }

  /**
   * Groups packages into levels based on their dependencies.
   * Packages in the same level can be executed in parallel.
   */
  getLevels(packages: string[]): string[][] {
    const levels: string[][] = [];
    const visited = new Set<string>();
    const packageSet = new Set(packages);

    // Helper function to get the maximum level of dependencies
    const getMaxDependencyLevel = (pkg: string): number => {
      if (visited.has(pkg)) {
        return levels.findIndex((level) => level.includes(pkg));
      }

      const dependencies = this.edges.get(pkg) || new Set();
      if (dependencies.size === 0) return 0;

      let maxLevel = 0;
      for (const dep of dependencies) {
        if (packageSet.has(dep)) {
          const depLevel = getMaxDependencyLevel(dep);
          maxLevel = Math.max(maxLevel, depLevel + 1);
        }
      }
      return maxLevel;
    };

    // First, process all packages with no dependencies
    const noDeps = packages.filter((pkg) => {
      const deps = this.edges.get(pkg) || new Set();
      return deps.size === 0 || ![...deps].some((dep) => packageSet.has(dep));
    });

    if (noDeps.length > 0) {
      levels[0] = noDeps;
      noDeps.forEach((pkg) => visited.add(pkg));
    }

    // Then process remaining packages
    for (const pkg of packages) {
      if (visited.has(pkg)) continue;

      const level = getMaxDependencyLevel(pkg);
      if (!levels[level]) {
        levels[level] = [];
      }
      levels[level].push(pkg);
      visited.add(pkg);
    }

    // Remove empty levels and return
    return levels.filter((level) => level.length > 0);
  }
}
