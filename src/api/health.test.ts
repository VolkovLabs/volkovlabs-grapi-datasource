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
 * Health API
 */
describe('Health Api', () => {
  const instanceSettings: any = {};

  /**
   * Api
   */
  const api = new Api(instanceSettings);

  /**
   * Get Health
   */
  describe('getHealth', () => {
    const response = {
      status: 200,
      statusText: 'OK',
      ok: true,
      data: {
        commit: '978237e7cb',
        database: 'ok',
        version: '9.3.6',
      },
      headers: {},
      url: 'http://localhost:3000/api/datasources/proxy/1/api/health',
      type: 'basic',
      redirected: false,
      config: {
        method: 'GET',
        url: 'api/datasources/proxy/1/api/health',
        retry: 0,
        headers: {
          'X-Grafana-Org-Id': 1,
          'X-Grafana-NoCache': 'true',
        },
        hideFromInspector: false,
      },
    };

    const query = { refId: 'A', requestType: RequestType.DATASOURCES };

    it('Should make getHealth request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(response));
      const result = await api.features.health.get();
      expect(result).toBeTruthy();
    });

    it('Should not make getHealth request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(undefined));

      const result = await api.features.health.get();
      expect(result).toBeFalsy();
    });

    it('Should throw exception getHealth request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getErrorResponse());

      try {
        const result = await api.features.health.get();
        expect(result).toThrow(TypeError);
      } catch (e) {}
    });

    it('Should make getHealthFrame request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(response));
      const result = await api.features.health.getFrame(query);
      expect(result?.length).toEqual(1);
      expect(result[0].fields.length).toEqual(3);
      expect(result[0].fields[0].values).toEqual(['978237e7cb']);
    });

    it('Should handle getHealthFrame request with no data', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() =>
        getResponse({
          ...response,
          data: {},
        })
      );

      const result = await api.features.health.getFrame(query);
      expect(result?.length).toEqual(0);
    });
  });
});
