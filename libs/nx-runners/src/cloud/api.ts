import { Task } from '@nrwl/devkit';
import axios, { Axios } from 'axios';
import { Injectable } from 'injection-js';
import { CloudTask, CloudTaskStatus } from './cloud-task';
import { OPTIONS } from '../core/options';
import { CloudRunnerOptions } from './runner-factory';
import { ApiHttpJob } from '../core/job';

export const axiosProvider = {
  provide: Axios,
  useFactory: (options: CloudRunnerOptions) =>
    options?.apiUrl ? axios.create({ baseURL: options.apiUrl }) : null,
  deps: [OPTIONS],
};

@Injectable()
export class Api {
  constructor(private axios: Axios | null) {}

  async createJob(job: Omit<ApiHttpJob, 'id' | 'status'>): Promise<ApiHttpJob> {
    const { data } = await this.axios.post<ApiHttpJob>(`/job`, job);

    return data;
  }

  async getJob(id: string): Promise<ApiHttpJob> {
    const { data: job } = await this.axios.get<ApiHttpJob>(`/job/${id}`);

    return job;
  }
}
