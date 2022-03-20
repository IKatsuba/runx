import { Environment, StorageProvider } from '@runx/api/env';

export const environment: Environment = {
  production: false,
  provider: process.env.STORAGE_PROVIDER as StorageProvider.Firebase,
  db: {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    synchronize: true,
    retryAttempts: 2,
  },
  prometheus: {
    baseUrl: 'http://localhost:9090/api/v1',
  },
};
