import { NoopStorage, Storage } from '../core/storage';
import { OPTIONS } from '../core/options';
import { Readable } from 'stream';
import { FirebaseCachingRunnerOptions } from './runner-factory';
import firebase, { ServiceAccount } from 'firebase-admin';
import axios from 'axios';
import { AppOptions } from 'firebase-admin/lib/app/core';

export interface FirebaseStorageOptions extends Omit<AppOptions, 'credential'> {
  credential: ServiceAccount;
}

export class FirebaseStorage extends Storage {
  private app: firebase.app.App;

  constructor({ credential, ...firebaseOptions }: FirebaseStorageOptions) {
    super();

    this.app = firebase.initializeApp({
      ...firebaseOptions,
      credential: firebase.credential.cert(credential),
    });
  }

  async get(
    key: string
  ): Promise<Buffer | Uint8Array | Blob | string | Readable> {
    const [url] = await this.app
      .storage()
      .bucket()
      .file(key)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 2 * 24 * 60 * 60 * 1_000,
      });

    const response = await axios.get(url, {
      responseType: 'stream',
    });

    return response.data;
  }

  async put(
    fileContent: Buffer | Uint8Array | Blob | string | Readable,
    key: string
  ): Promise<any> {
    const [url] = await this.app
      .storage()
      .bucket()
      .file(key)
      .getSignedUrl({
        action: 'write',
        expires: Date.now() + 2 * 24 * 60 * 60 * 1_000,
        contentType: 'application/octet-stream',
      });

    await axios.put(url, fileContent, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
  }
}

function loadConfigFromEnvironment(): FirebaseStorageOptions {
  try {
    return process.env.FIREBASE_CONFIG
      ? JSON.parse(process.env.FIREBASE_CONFIG)
      : null;
  } catch (e) {
    return null;
  }
}

export const storageProvider = {
  provide: Storage,
  useFactory: (runnerOptions: FirebaseCachingRunnerOptions) => {
    const options = runnerOptions?.firebase ?? loadConfigFromEnvironment();

    return options ? new FirebaseStorage(options) : new NoopStorage();
  },

  deps: [OPTIONS],
};
