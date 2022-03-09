import { Task } from '@nrwl/devkit';
import axios, { Axios } from 'axios';
import { Injectable } from 'injection-js';
import { CloudTask, CloudTaskStatus } from './cloud-task';
import { OPTIONS } from '../core/options';
import { CloudRunnerOptions } from './runner-factory';

export const axiosProvider = {
  provide: Axios,
  useFactory: (options: CloudRunnerOptions) =>
    options?.apiUrl ? axios.create({ baseURL: options.apiUrl }) : null,
  deps: [OPTIONS],
};

@Injectable()
export class Api {
  constructor(private axios: Axios | null) {}

  async createCloudTask(tasks: Task[]): Promise<string> {
    const {
      data: { id },
    } = await this.axios.post<{ id: string }>(`/task`, tasks);

    return id;
  }

  async getTaskStatus(id: string): Promise<CloudTaskStatus> {
    const {
      data: { status },
    } = await this.axios.get<CloudTask>(`/task/${id}`);

    return status;
  }
}
