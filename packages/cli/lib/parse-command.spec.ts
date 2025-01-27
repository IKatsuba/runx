import { expect } from 'jsr:@std/expect';
import { parseFullCommand } from './parse-command.ts';

Deno.test('parseFullCommand', async (t) => {
  await t.step('should parse a single command correctly', () => {
    const result = parseFullCommand('ls');
    expect(result).toEqual([{
      env: {},
      command: 'ls',
      args: [],
    }]);
  });

  await t.step('should handle multiple arguments', () => {
    const result = parseFullCommand('git commit -m "Initial commit"');
    expect(result).toEqual([{
      env: {},
      command: 'git',
      args: ['commit', '-m', '"Initial commit"'],
    }]);
  });

  await t.step('should parse environment variables', () => {
    const result = parseFullCommand(
      'NODE_ENV=production PORT=3000 node server.js',
    );
    expect(result).toEqual([{
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      command: 'node',
      args: ['server.js'],
    }]);
  });

  await t.step('should handle command chains with &&', () => {
    const result = parseFullCommand('ENV=1 npm install && ENV=2 npm start');
    expect(result).toEqual([
      {
        env: {
          ENV: '1',
        },
        command: 'npm',
        args: ['install'],
      },
      '&&',
      {
        env: {
          ENV: '2',
        },
        command: 'npm',
        args: ['start'],
      },
    ]);
  });

  await t.step('should handle quoted strings correctly', () => {
    const result = parseFullCommand('echo "Hello World" \'Test\'');
    expect(result).toEqual([{
      env: {},
      command: 'echo',
      args: ['"Hello World"', "'Test'"],
    }]);
  });

  await t.step('should handle empty commands', () => {
    const result = parseFullCommand('  ');
    expect(result).toEqual([]);
  });
});
