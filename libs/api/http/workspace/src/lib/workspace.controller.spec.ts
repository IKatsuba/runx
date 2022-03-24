import { Test } from '@nestjs/testing';
import { WorkspaceController } from './workspace.controller';
import { TokenService } from '@runx/api/auth';

describe('ApiHttpWorkspaceController', () => {
  let controller: WorkspaceController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TokenService],
      controllers: [WorkspaceController],
    }).compile();

    controller = module.get(WorkspaceController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
