import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { readWorkspaceConfiguration, Tree } from '@nrwl/devkit';

import generator from './generator';
import { AddGeneratorSchema } from './schema';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

describe('add generator', () => {
  let appTree: Tree;
  const options: AddGeneratorSchema = { baseUrl: 'https://runx.cloud/' };
  const axiosMock = new MockAdapter(axios);

  beforeEach(() => {
    axiosMock.resetHandlers();
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    axiosMock
      .onPost('https://runx.cloud/v1/workspace', { name: 'proj' })
      .reply(200, { accessToken: 'asxasxasxasx' });

    await generator(appTree, options);
    const config = readWorkspaceConfiguration(appTree);
    expect(config).toEqual({
      affected: {
        defaultBase: 'main',
      },
      npmScope: 'proj',
      tasksRunnerOptions: {
        default: {
          options: {
            accessToken: 'asxasxasxasx',
            baseUrl: 'https://runx.cloud/',
            cacheableOperations: ['build', 'lint', 'test', 'e2e'],
          },
          runner: '@runx/nx-runners/cloud',
        },
      },
      version: 1,
    });
  });
});
