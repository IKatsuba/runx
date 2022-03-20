import {
  formatFiles,
  Tree,
  readWorkspaceConfiguration,
  updateWorkspaceConfiguration,
} from '@nrwl/devkit';
import { AddGeneratorSchema } from './schema';
import axios from 'axios';

export default async function (tree: Tree, options: AddGeneratorSchema) {
  const workspaceConfig = readWorkspaceConfiguration(tree);

  const name = workspaceConfig.npmScope;

  const {
    data: { accessToken },
  } = await axios
    .create({ baseURL: options.baseUrl })
    .post<{ accessToken: string }>('v1/workspace', { name });

  workspaceConfig.tasksRunnerOptions.default.runner = '@runx/nx-runners/cloud';
  workspaceConfig.tasksRunnerOptions.default.options.baseUrl = options.baseUrl;
  workspaceConfig.tasksRunnerOptions.default.options.accessToken = accessToken;

  updateWorkspaceConfiguration(tree, workspaceConfig);

  await formatFiles(tree);
}
