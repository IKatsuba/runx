import { Environment, StorageProvider } from '@runx/api/env';

export const environment: Environment = {
  production: false,
  provider: process.env.STORAGE_PROVIDER as StorageProvider.Firebase,
};
