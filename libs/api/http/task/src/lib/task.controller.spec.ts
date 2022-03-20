import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskEntity } from '@runx/api/db';

describe('TaskController', () => {
  let controller: TaskController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: getRepositoryToken(TaskEntity),
          useValue: {
            update: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
