import { FileStorage } from '../lib/file-storage';
import { defer, map, Observable } from 'rxjs';
import { FirebaseStorageConfig } from '@runx/api/env';
import firebase from 'firebase-admin';

export class FirebaseStorageService extends FileStorage {
  private app: firebase.app.App;

  constructor(private config: FirebaseStorageConfig) {
    super();

    const { credential, ...firebaseConfig } = config;

    this.app = firebase.initializeApp({
      ...firebaseConfig,
      credential: firebase.credential.cert(credential),
    });
  }

  getDownloadUrl(hash: string): Observable<string> {
    return defer(() =>
      this.app
        .storage()
        .bucket()
        .file(hash)
        .getSignedUrl({
          action: 'read',
          expires: Date.now() + 2 * 24 * 60 * 60 * 1_000,
        })
    ).pipe(map(([response]) => response));
  }

  getUploadUrl(hash: string): Observable<string> {
    return defer(() =>
      this.app
        .storage()
        .bucket()
        .file(hash)
        .getSignedUrl({
          action: 'write',
          expires: Date.now() + 2 * 24 * 60 * 60 * 1_000,
          contentType: 'application/octet-stream',
        })
    ).pipe(map(([response]) => response));
  }
}
