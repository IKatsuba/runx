import { AuthGuard } from './auth.guard';

xdescribe('AuthGuard', () => {
  it('should be defined', () => {
    expect(new AuthGuard()).toBeDefined();
  });
});
