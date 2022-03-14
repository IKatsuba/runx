process.env.RUNX_AGENT_INTERVAL_DURATION = '3_000';

import MockAdapter from 'axios-mock-adapter';
import { api, nxAgent } from './nx-agent';
import { JobStatus } from '@runx/nx-runners/src/core/job';
import { lastValueFrom } from 'rxjs';

describe('nxAgent', () => {
  const axiosMock = new MockAdapter(api, { delayResponse: 1000 });

  const JOB_ID = (process.env.RUNX_JOB_ID = '123');

  it('should be complete, if job is already completed', async () => {
    expect.assertions(1);

    axiosMock
      .onGet(`v1/job/${JOB_ID}/task/planned`)
      .reply(200, { status: JobStatus.Completed });

    expect(
      await lastValueFrom(nxAgent, { defaultValue: undefined })
    ).toStrictEqual(undefined);
  });

  it('should be complete, if job has no tasks', async () => {
    expect.assertions(1);

    axiosMock
      .onGet(`v1/job/${JOB_ID}/task/planned`)
      .replyOnce(200, { status: JobStatus.Planned })
      .onGet(`v1/job/${JOB_ID}/task/planned`)
      .replyOnce(200, { status: JobStatus.Completed });

    expect(await lastValueFrom(nxAgent)).toStrictEqual(null);
  }, 20_000);

  it('should complete, if job has tasks', async () => {
    expect.assertions(1);

    axiosMock
      .onGet(`v1/job/${JOB_ID}/task/planned`)
      .replyOnce(200, {
        status: JobStatus.Planned,
        tasks: [
          {
            uuid: '1923019283',
            id: 'api:_mock',
            target: {
              project: 'api',
              target: '_mock',
            },
            implicitDeps: {},
          },
        ],
      })
      .onGet(`v1/job/${JOB_ID}/task/planned`)
      .replyOnce(200, {
        status: JobStatus.Completed,
      });

    axiosMock.onPost(`v1/task/${'1923019283'}`).reply(200, {
      status: JobStatus.Completed,
      exitCode: 0,
    });

    expect(await lastValueFrom(nxAgent)).toStrictEqual({
      exitCode: 0,
      status: 2,
    });
  }, 20_000);

  it('should complete even if there are tasks with errors', async () => {
    expect.assertions(2);

    axiosMock
      .onGet(`v1/job/${JOB_ID}/task/planned`)
      .replyOnce(200, {
        status: JobStatus.Planned,
        tasks: [
          {
            uuid: '1923019283',
            id: 'api:_errorTarget',
            target: {
              project: 'api',
              target: '_errorTarget',
            },
            implicitDeps: {},
          },
        ],
      })
      .onGet(`v1/job/${JOB_ID}/task/planned`)
      .replyOnce(200, {
        status: JobStatus.Completed,
        exitCode: 1,
      });

    axiosMock.onPost(`v1/task/${'1923019283'}`).reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ status: 2, exitCode: 1 });

      return [
        200,
        {
          status: JobStatus.Completed,
          exitCode: 1,
        },
      ];
    });

    expect(await lastValueFrom(nxAgent)).toStrictEqual({
      exitCode: 1,
      status: 2,
    });
  }, 20_000);

  it('should skip 404 errors', async () => {
    expect.assertions(1);

    axiosMock
      .onGet(`v1/job/${process.env.RUNX_JOB_ID}/task/planned`)
      .replyOnce(404)
      .onGet(`v1/job/${process.env.RUNX_JOB_ID}/task/planned`)
      .replyOnce(200, {
        status: JobStatus.Planned,
        tasks: [
          {
            uuid: '1923019283',
            id: 'api:_mock',
            target: {
              project: 'api',
              target: '_mock',
            },
            implicitDeps: {},
          },
        ],
      })
      .onGet(`v1/job/${process.env.RUNX_JOB_ID}/task/planned`)
      .replyOnce(200, {
        status: JobStatus.Completed,
      });

    axiosMock.onPost(`v1/task/${'1923019283'}`).reply(200, {
      status: JobStatus.Completed,
      exitCode: 0,
    });

    expect(await lastValueFrom(nxAgent)).toStrictEqual({
      exitCode: 0,
      status: 2,
    });
  }, 20_000);

  afterEach(() => {
    axiosMock.resetHandlers();
  });
});
