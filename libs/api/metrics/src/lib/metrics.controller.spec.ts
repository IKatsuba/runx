import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { metricsProvider } from './metrics.service';
import { makeSummaryProvider } from '@willsoto/nestjs-prometheus';
import { ConfigModule } from '@nestjs/config';

describe('MetricsController', () => {
  let controller: MetricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      controllers: [MetricsController],
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

    controller = module.get<MetricsController>(MetricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
