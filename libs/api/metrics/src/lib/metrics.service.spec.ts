import { Test, TestingModule } from '@nestjs/testing';
import { metricsProvider, MetricsService } from './metrics.service';
import { makeSummaryProvider } from '@willsoto/nestjs-prometheus';
import { ConfigModule } from '@nestjs/config';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
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
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
