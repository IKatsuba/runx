import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  makeSummaryProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Global()
@Module({})
export class ApiMetricsModule {
  static forRoot(): DynamicModule {
    return {
      module: ApiMetricsModule,
      imports: [PrometheusModule.register({ controller: MetricsController })],
      exports: [PrometheusModule, MetricsService],
      providers: [
        MetricsService,
        makeSummaryProvider({
          name: 'task_execution_time',
          help: 'Task execution time',
          labelNames: [
            'id',
            'project',
            'target',
            'configuration',
            'npmScope',
            'command',
          ],
        }),
      ],
      global: true,
    };
  }
}
