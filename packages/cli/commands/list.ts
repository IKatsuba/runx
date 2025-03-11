import { Command } from '@cliffy/command';
import {
  getWorkspacePatterns,
  getWorkspaceProjects,
  readRootConfig,
} from '../lib/workspace.ts';
import { logger } from '../lib/logger.ts';

export const listCommand = new Command()
  .description('List all packages')
  .option('--json', 'Output in JSON format')
  .action(async ({ json }) => {
    const rootPackageJson = await readRootConfig();
    const workspacePatterns = getWorkspacePatterns(rootPackageJson);

    // Find all packages using optimized search
    const packageFiles = await getWorkspaceProjects(
      workspacePatterns,
    );

    if (json) {
      logger.raw(
        JSON.stringify(
          packageFiles.map((packageFile) => packageFile.name),
          null,
          2,
        ),
      );
    } else {
      for (const packageFile of packageFiles) {
        logger.info(packageFile.name);
      }
    }
  });
