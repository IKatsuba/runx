import { Body, Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Controller({ version: VERSION_NEUTRAL })
export class MetricsController extends PrometheusController {
  constructor(private metricsService: MetricsService) {
    super();
  }

  @Post()
  sendMetrics(
    @Body() values: [Record<string, number | string>, number][]
  ): void {
    for (const [labels, value] of values) {
      this.metricsService.addMetric(labels, value);
    }
  }
}
