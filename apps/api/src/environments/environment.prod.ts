import { Environment, StorageProvider } from '@nx-cloud/api/env';

export const environment: Environment = {
  production: true,
  provider: process.env.STORAGE_PROVIDER as StorageProvider.Firebase,
};
