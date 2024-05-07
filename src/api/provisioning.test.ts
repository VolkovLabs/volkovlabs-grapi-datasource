import { Observable } from 'rxjs';

import { RequestType } from '../types';
import { Api } from './api';

/**
 * Response
 *
 * @param response
 */
const getResponse = (response: any) =>
  new Observable((subscriber) => {
    subscriber.next(response);
    subscriber.complete();
  });

/**
 * Throw Exception Response
 */
const getErrorResponse = () =>
  new Observable(() => {
    throw new TypeError('Error');
  });

/**
 * Fetch request Mock
 */
let fetchRequestMock = jest.fn().mockImplementation(() => getResponse({}));

/**
 * Mock @grafana/runtime
 */
jest.mock('@grafana/runtime', () => ({
  getBackendSrv: () => ({
    fetch: fetchRequestMock,
  }),
  getAppEvents: () => ({
    publish: jest.fn().mockImplementation(() => {}),
  }),
}));

/**
 * Provisioning API
 */
describe('Provisioning Api', () => {
  const instanceSettings: any = {};

  /**
   * Api
   */
  const api = new Api(instanceSettings, { version: '10.0.0' });

  /**
   * Get Alert Rules
   */
  describe('GetAlertRules', () => {
    const response = {
      status: 200,
      statusText: 'OK',
      ok: true,
      data: [
        {
          id: 1,
          uid: 'ox_h9f-4k',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          orgID: 1,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          folderUID: 'e_2vH6aVk',
          ruleGroup: 'Test',
          title: 'Metrics',
          condition: 'C',
          data: [
            {
              refId: 'A',
              queryType: '',
              relativeTimeRange: {
                from: 21600,
                to: 0,
              },
              datasourceUid: 'timescale',
              model: {
                datasource: {
                  type: 'postgres',
                  uid: 'timescale',
                },
                editorMode: 'code',
                format: 'table',
                group: [],
                intervalMs: 60000,
                maxDataPoints: 43200,
                metricColumn: 'none',
                rawQuery: true,
                rawSql: 'SELECT last(value, time), name\nFROM metrics\nWHERE $__timeFilter(time)\ngroup by name',
                refId: 'A',
                requestType: 'none',
                select: [
                  [
                    {
                      params: ['value'],
                      type: 'column',
                    },
                  ],
                ],
                sql: {
                  columns: [
                    {
                      parameters: [],
                      type: 'function',
                    },
                  ],
                  groupBy: [
                    {
                      property: {
                        type: 'string',
                      },
                      type: 'groupBy',
                    },
                  ],
                  limit: 50,
                },
                table: 'metrics',
                timeColumn: 'created',
                timeColumnType: 'timestamp',
                where: [
                  {
                    name: '$__timeFilter',
                    params: [],
                    type: 'macro',
                  },
                ],
              },
            },
            {
              refId: 'B',
              queryType: '',
              relativeTimeRange: {
                from: 21600,
                to: 0,
              },
              datasourceUid: '__expr__',
              model: {
                conditions: [
                  {
                    evaluator: {
                      params: [],
                      type: 'gt',
                    },
                    operator: {
                      type: 'and',
                    },
                    query: {
                      params: ['B'],
                    },
                    reducer: {
                      params: [],
                      type: 'last',
                    },
                    type: 'query',
                  },
                ],
                datasource: {
                  type: '__expr__',
                  uid: '__expr__',
                },
                expression: 'A',
                hide: false,
                intervalMs: 1000,
                maxDataPoints: 43200,
                reducer: 'last',
                refId: 'B',
                type: 'reduce',
              },
            },
            {
              refId: 'C',
              queryType: '',
              relativeTimeRange: {
                from: 21600,
                to: 0,
              },
              datasourceUid: '__expr__',
              model: {
                conditions: [
                  {
                    evaluator: {
                      params: [0],
                      type: 'gt',
                    },
                    operator: {
                      type: 'and',
                    },
                    query: {
                      params: ['C'],
                    },
                    reducer: {
                      params: [],
                      type: 'last',
                    },
                    type: 'query',
                  },
                ],
                datasource: {
                  type: '__expr__',
                  uid: '__expr__',
                },
                expression: 'B',
                hide: false,
                intervalMs: 1000,
                maxDataPoints: 43200,
                refId: 'C',
                type: 'threshold',
              },
            },
          ],
          updated: '2023-03-19T08:33:31Z',
          noDataState: 'NoData',
          execErrState: 'Error',
          for: '20s',
          annotations: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            __dashboardUid__: 'Rcb6nob4k',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            __panelId__: '2',
          },
          isPaused: false,
        },
      ],
      headers: {},
      url: 'http://localhost:3000/api/datasources/proxy/uid/grapi/api/v1/provisioning/alert-rules',
      type: 'basic',
      redirected: false,
      config: {
        method: 'GET',
        url: 'api/datasources/proxy/uid/grapi/api/v1/provisioning/alert-rules',
        retry: 0,
        headers: {
          'X-Grafana-Org-Id': 1,
        },
        hideFromInspector: false,
      },
    };

    const query = { refId: 'A', requestType: RequestType.ALERT_RULES };

    it('Should make getAlertRules request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(response));
      const result = await api.features.provisioning.getAlertRules();
      expect(result).toBeTruthy();
    });

    it('Should not make getAlertRules request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(undefined));

      const result = await api.features.provisioning.getAlertRules();
      expect(result).toBeTruthy();
      expect(result.length).toBe(0);
    });

    it('Should throw exception getAlertRules request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getErrorResponse());

      try {
        const result = await api.features.provisioning.getAlertRules();
        expect(result).toThrow(TypeError);
      } catch (e) {}
    });

    it('Should make getAlertRulesFrame request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(response));
      const result = await api.features.provisioning.getAlertRulesFrame(query);
      expect(result?.length).toEqual(1);
      expect(result[0].fields.length).toEqual(9);
      expect(result[0].fields[0].values).toEqual([1]);
    });

    it('Should handle getAlertRulesFrame request with no data', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() =>
        getResponse({
          ...response,
          data: [],
        })
      );

      const result = await api.features.provisioning.getAlertRulesFrame(query);
      expect(result?.length).toEqual(0);
    });
  });
});
