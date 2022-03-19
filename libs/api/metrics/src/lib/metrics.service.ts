import { Injectable } from '@nestjs/common';
import { Summary } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('task_execution_time')
    private executionTimeMetric: Summary<string>
  ) {}

  public addMetric(
    labels: Record<string, number | string>,
    value: number
  ): void {
    this.executionTimeMetric.observe(labels, value);
  }
}
