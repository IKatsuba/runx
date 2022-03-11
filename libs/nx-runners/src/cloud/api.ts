import axios, { Axios } from 'axios';
import { Injectable } from 'injection-js';
import { OPTIONS } from '../core/options';
import { CloudRunnerOptions } from './runner-factory';
import { Job } from '../core/job';

export const axiosProvider = {
  provide: Axios,
  useFactory: (options: CloudRunnerOptions) =>
    options?.apiUrl ? axios.create({ baseURL: options.apiUrl }) : null,
  deps: [OPTIONS],
};

@Injectable()
export class Api {
  constructor(private axios: Axios | null) {}

  async createJob(job: Omit<Job, 'status'>): Promise<Job> {
    const { data } = await this.axios.post<Job>(`/job`, job);

    return data;
  }

  async getJob(id: string): Promise<Job> {
    const { data: job } = await this.axios.get<Job>(`/job/${id}`);

    return job;
  }
}
