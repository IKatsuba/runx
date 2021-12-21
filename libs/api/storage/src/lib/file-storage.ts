import { Observable } from 'rxjs';

export abstract class FileStorage {
  abstract getDownloadUrl(
    hash: string,
    options?: { force: boolean }
  ): Observable<string | null>;
  abstract getUploadUrl(hash: string): Observable<string>;
}
