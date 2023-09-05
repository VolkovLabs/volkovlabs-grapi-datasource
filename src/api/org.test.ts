import { Observable } from 'rxjs';
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
const getErrorResponse = (response: any) =>
  new Observable((subscriber) => {
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
 * Org API
 */
describe('Org Api', () => {
  const instanceSettings: any = {};

  /**
   * Api
   */
  const api = new Api(instanceSettings);

  /**
   * Get Org
   */
  describe('GetOrg', () => {
    const response = {
      status: 200,
      statusText: 'OK',
      ok: true,
      data: {
        id: 1,
        name: 'VolkovOrg',
        address: {
          address1: '',
          address2: '',
          city: '',
          zipCode: '',
          state: '',
          country: '',
        },
      },
      headers: {},
      url: 'http://localhost:3000/api/datasources/proxy/1/api/org',
      type: 'basic',
      redirected: false,
      config: {
        method: 'GET',
        url: 'api/datasources/proxy/1/api/org',
        retry: 0,
        headers: {
          'X-Grafana-Org-Id': 1,
          'X-Grafana-NoCache': 'true',
        },
        hideFromInspector: false,
      },
    };

    it('Should make getOrg request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(response));
      let result = await api.org.get();
      expect(result).toBeTruthy();
    });

    it('Should not make getOrg request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(undefined));
      jest.spyOn(console, 'error').mockImplementation();

      let result = await api.org.get();
      expect(result).toBeFalsy();
    });

    it('Should throw exception getOrg request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getErrorResponse(response));

      try {
        let result = await api.org.get();
        expect(result).toThrow(TypeError);
      } catch (e) {}
    });
  });
});
