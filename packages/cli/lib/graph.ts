export interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[];
}

export interface DependencyNode {
  name: string;
  version: string;
  dependencies: DependencyNode[];
  isLocal: boolean; // Флаг для определения локального пакета
}

export class Graph {
  private nodes: Map<string, DependencyNode> = new Map();
  private localPackages: Map<string, PackageJson> = new Map();

  constructor(packages: PackageJson[]) {
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

  private async createNode(packageJson: PackageJson): Promise<DependencyNode> {
    const nodeKey = packageJson.name;

    // Проверяем, не создавали ли мы уже этот узел
    if (this.nodes.has(nodeKey)) {
      return this.nodes.get(nodeKey)!;
    }

    const node: DependencyNode = {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: [],
      isLocal: true,
    };

    // Сохраняем узел в кэш
    this.nodes.set(nodeKey, node);

    // Обрабатываем все зависимости
    const allDependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    for (const [depName, depVersion] of Object.entries(allDependencies)) {
      // Проверяем, является ли зависимость локальным пакетом
      const localDep = this.localPackages.get(depName);

      if (localDep) {
        // Если это локальный пакет, создаем для него узел
        const childNode = await this.createNode(localDep);
        node.dependencies.push(childNode);
      }
      // Внешние зависимости можно пропустить или обработать отдельно
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
}
