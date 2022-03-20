import { Test } from '@nestjs/testing';
import { WorkspaceController } from './workspace.controller';

describe('ApiHttpWorkspaceController', () => {
  let controller: WorkspaceController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [],
      controllers: [WorkspaceController],
    }).compile();

    controller = module.get(WorkspaceController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
