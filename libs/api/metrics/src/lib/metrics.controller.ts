import { Body, Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Controller({ version: VERSION_NEUTRAL })
export class MetricsController extends PrometheusController {
  constructor(private metricsService: MetricsService) {
    super();
  }

  @Post()
  async sendMetrics(
    @Body() values: [Record<string, number | string>, number][]
  ): Promise<void> {
    for (const [labels, value] of values) {
      if (value) {
        this.metricsService.addExecutionTime(labels, value);
      } else {
        this.metricsService.addSavedTime(labels);
      }
    }
  }
}
