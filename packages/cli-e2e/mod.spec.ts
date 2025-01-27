import { assert } from 'jsr:@std/assert';

Deno.test('cli-e2e', async () => {
  const command = new Deno.Command('deno', {
    args: [
      'run',
      '--allow-run',
      '--allow-write',
      '--allow-read',
      '--allow-env',
      '--unstable',
      './packages/cli/mod.ts',
    ],
    stdout: 'inherit',
    cwd: Deno.cwd(),
  });

  const { code } = await command.output();
  assert(code === 0);
});
