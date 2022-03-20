import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenService],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a token', async () => {
    expect(
      await service.create({ exp: 1234567890, workspaceName: 'name' })
    ).toEqual('WEdijMcVJ7aY25h5cB04fWzvkxRVfP18DM7sYbgO5P2Rf8inXA==');
  });

  it('should validate a token', async () => {
    expect(
      await service.validateToken(
        'WEdijMcVJ7aY25h5cB04fWzvkxRVfP18DM7sYbgO5P2Rf8inXA=='
      )
    ).toEqual(false);
  });
});
