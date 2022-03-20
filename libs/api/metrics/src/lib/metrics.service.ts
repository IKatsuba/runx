import { Summary } from 'prom-client';
import { getToken } from '@willsoto/nestjs-prometheus';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Environment } from '@runx/api/env';
import { FactoryProvider } from '@nestjs/common';

export abstract class MetricsService {
  abstract addExecutionTime(
    labels: Record<string, number | string>,
    value: number
  ): Promise<void>;

  abstract addSavedTime(labels: Record<string, number | string>): Promise<void>;
}

export class NoopMetricsService extends MetricsService {
  addExecutionTime(
    labels: Record<string, number | string>,
    value: number
  ): Promise<void> {
    return Promise.resolve(undefined);
  }

  addSavedTime(labels: Record<string, number | string>): Promise<void> {
    return Promise.resolve(undefined);
  }
}

export class PromMetricsService extends MetricsService {
  private api = axios.create({
    baseURL: this.baseUrl,
  });

  constructor(
    private executionTimeMetric: Summary<string>,
    private savedTimeMetric: Summary<string>,
    private baseUrl: string
  ) {
    super();
  }

  async addExecutionTime(
    labels: Record<string, number | string>,
    value: number
  ): Promise<void> {
    this.executionTimeMetric.observe(labels, value);
  }

  async addSavedTime(labels: Record<string, number | string>): Promise<void> {
    const formattedLabels = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    const {
      data: {
        data: { result },
      },
    } = await this.api.get<{ data: { result: { value: [number, string] }[] } }>(
      '/query',
      {
        params: {
          query: `max_over_time(task_execution_time{${formattedLabels}}[1w])`,
        },
      }
    );

    const time = Math.max(...result.map((item) => parseFloat(item.value[1])));

    if (time && Number.isFinite(time)) {
      this.savedTimeMetric.observe(labels, time);
    }
  }
}

export const metricsProvider: FactoryProvider = {
  provide: MetricsService,
  useFactory(
    executionTimeMetric: Summary<string>,
    savedTimeMetric: Summary<string>,
    config: ConfigService
  ) {
    const { baseUrl } = config.get<Environment['prometheus']>('prometheus');

    return baseUrl
      ? new PromMetricsService(executionTimeMetric, savedTimeMetric, baseUrl)
      : new NoopMetricsService();
  },
  inject: [
    getToken('task_execution_time'),
    getToken('task_saved_time'),
    ConfigService,
  ],
};
