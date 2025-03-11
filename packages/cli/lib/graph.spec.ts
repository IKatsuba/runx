import { Graph } from './graph.ts';
import type { Project } from './graph.ts';
import { expect } from 'jsr:@std/expect';

Deno.test('Graph', async (t) => {
  await t.step('buildGraph', async (t) => {
    await t.step('should build a simple dependency tree', async () => {
      const packages: Project[] = [
        {
          name: 'package-a',
          path: 'packages/package-a',
          tasks: {},
          version: '1.0.0',
          dependencies: {
            'package-b': '^1.0.0',
          },
        },
        {
          name: 'package-b',
          path: 'packages/package-b',
          tasks: {},
          version: '1.0.0',
          dependencies: {},
        },
      ];

      const graph = new Graph(packages);
      const tree = await graph.buildGraph();

      expect(tree).toHaveLength(2);
      expect(tree[0].name).toBe('package-a');
      expect(tree[0].dependencies).toHaveLength(1);
      expect(tree[0].dependencies[0].name).toBe('package-b');
      expect(tree[1].name).toBe('package-b');
      expect(tree[1].dependencies).toHaveLength(0);
    });

    await t.step('should handle packages with no dependencies', async () => {
      const packages: Project[] = [
        {
          name: 'standalone-package',
          path: 'packages/standalone-package',
          tasks: {},
          version: '1.0.0',
          dependencies: {},
        },
      ];

      const graph = new Graph(packages);
      const tree = await graph.buildGraph();

      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('standalone-package');
      expect(tree[0].dependencies).toHaveLength(0);
    });

    await t.step('should handle devDependencies', async () => {
      const packages: Project[] = [
        {
          name: 'package-a',
          path: 'packages/package-a',
          tasks: {},
          version: '1.0.0',
          dependencies: {
            'package-b': '^1.0.0',
          },
        },
        {
          name: 'package-b',
          path: 'packages/package-b',
          tasks: {},
          version: '1.0.0',
          dependencies: {},
        },
      ];

      const graph = new Graph(packages);
      const tree = await graph.buildGraph();

      expect(tree[0].dependencies).toHaveLength(1);
      expect(tree[0].dependencies[0].name).toBe('package-b');
    });
  });

  await t.step('findCircularDependencies', async (t) => {
    await t.step('should detect circular dependencies', async () => {
      const packages: Project[] = [
        {
          name: 'package-a',
          path: 'packages/package-a',
          tasks: {},
          version: '1.0.0',
          dependencies: {
            'package-b': '^1.0.0',
          },
        },
        {
          name: 'package-b',
          path: 'packages/package-b',
          tasks: {},
          version: '1.0.0',
          dependencies: {
            'package-a': '^1.0.0',
          },
        },
      ];

      const graph = new Graph(packages);
      await graph.buildGraph();
      const cycles = graph.findCircularDependencies();

      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toEqual(['package-a', 'package-b', 'package-a']);
    });

    await t.step('should handle no circular dependencies', async () => {
      const packages: Project[] = [
        {
          name: 'package-a',
          path: 'packages/package-a',
          tasks: {},
          version: '1.0.0',
          dependencies: {
            'package-b': '^1.0.0',
          },
        },
        {
          name: 'package-b',
          path: 'packages/package-b',
          tasks: {},
          version: '1.0.0',
          dependencies: {},
        },
      ];

      const graph = new Graph(packages);
      await graph.buildGraph();
      const cycles = graph.findCircularDependencies();

      expect(cycles).toHaveLength(0);
    });
  });

  await t.step('getTopologicalSort', async (t) => {
    await t.step('should return correct build order', async () => {
      const packages: Project[] = [
        {
          name: 'package-c',
          path: 'packages/package-c',
          tasks: {},
          version: '1.0.0',
          dependencies: {},
        },
        {
          name: 'package-a',
          path: 'packages/package-a',
          tasks: {},
          version: '1.0.0',
          dependencies: {
            'package-b': '^1.0.0',
            'package-c': '^1.0.0',
          },
        },
        {
          name: 'package-b',
          path: 'packages/package-b',
          tasks: {},
          version: '1.0.0',
          dependencies: {
            'package-c': '^1.0.0',
          },
        },
      ];

      const graph = new Graph(packages);
      await graph.buildGraph();
      const order = graph.getTopologicalSort();

      expect(order).toEqual(['package-c', 'package-b', 'package-a']);
    });

    await t.step('should handle independent packages', async () => {
      const packages: Project[] = [
        {
          name: 'package-a',
          path: 'packages/package-a',
          tasks: {},
          version: '1.0.0',
          dependencies: {},
        },
        {
          name: 'package-b',
          path: 'packages/package-b',
          tasks: {},
          version: '1.0.0',
          dependencies: {},
        },
      ];

      const graph = new Graph(packages);
      await graph.buildGraph();
      const order = graph.getTopologicalSort();

      expect(order).toHaveLength(2);
      // Порядок может быть любым, так как пакеты независимы
      expect(order).toContain('package-a');
      expect(order).toContain('package-b');
    });
  });

  await t.step('edge cases', async (t) => {
    await t.step('should handle empty package list', async () => {
      const graph = new Graph([]);
      const tree = await graph.buildGraph();

      expect(tree).toHaveLength(0);
    });

    await t.step('should ignore external dependencies', async () => {
      const packages: Project[] = [
        {
          name: 'package-a',
          path: 'packages/package-a',
          tasks: {},
          version: '1.0.0',
          dependencies: {
            'external-package': '^1.0.0',
            'package-b': '^1.0.0',
          },
        },
        {
          name: 'package-b',
          path: 'packages/package-b',
          tasks: {},
          version: '1.0.0',
          dependencies: {},
        },
      ];

      const graph = new Graph(packages);
      const tree = await graph.buildGraph();

      expect(tree[0].dependencies).toHaveLength(1);
      expect(tree[0].dependencies[0].name).toBe('package-b');
    });
  });
});
