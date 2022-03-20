import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  makeSummaryProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { metricsProvider, MetricsService } from './metrics.service';

@Global()
@Module({})
export class ApiMetricsModule {
  static forRoot(): DynamicModule {
    return {
      module: ApiMetricsModule,
      imports: [PrometheusModule.register({ controller: MetricsController })],
      exports: [PrometheusModule, MetricsService],
      providers: [
        metricsProvider,
        makeSummaryProvider({
          name: 'task_execution_time',
          help: 'Task execution time',
          labelNames: [
            'overrides',
            'project',
            'target',
            'configuration',
            'npmScope',
          ],
        }),
        makeSummaryProvider({
          name: 'task_saved_time',
          help: 'Task saved time',
          labelNames: [
            'overrides',
            'project',
            'target',
            'configuration',
            'npmScope',
          ],
        }),
      ],
      global: true,
    };
  }
}
