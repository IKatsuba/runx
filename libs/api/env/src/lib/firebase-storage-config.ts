import { AppOptions, ServiceAccount } from 'firebase-admin';

export interface FirebaseStorageConfig extends Omit<AppOptions, 'credential'> {
  credential: ServiceAccount;
}
