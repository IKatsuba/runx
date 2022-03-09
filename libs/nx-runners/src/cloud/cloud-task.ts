export enum CloudTaskStatus {
  Pending,
  Complete,
}

export interface CloudTask {
  id: string;
  status: CloudTaskStatus;
}
