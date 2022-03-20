import { Body, Controller, Post } from '@nestjs/common';
import { TokenService } from '@runx/api/auth';

@Controller('workspace')
export class WorkspaceController {
  constructor(private tokenService: TokenService) {}

  @Post()
  async createWorkspace(
    @Body() { name }: { name: string }
  ): Promise<{ accessToken: string }> {
    return {
      accessToken: await this.tokenService.create({ workspaceName: name }),
    };
  }
}
