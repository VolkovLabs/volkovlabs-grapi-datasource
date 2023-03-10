import { Observable } from 'rxjs';
import { RequestType } from '../constants';
import { Api } from './api';
import { getDataSources, getDataSourcesFrame } from './datasources';

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
 * API
 */
describe('Api', () => {
  const instanceSettings: any = {};

  /**
   * Api
   */
  const api = new Api(instanceSettings);

  /**
   * Get Data Sources
   */
  describe('GetDataSources', () => {
    const response = {
      status: 200,
      statusText: 'OK',
      ok: true,
      data: [
        {
          id: 1,
          uid: 'grapi',
          orgId: 1,
          name: 'GrAPI',
          type: 'volkovlabs-grapi-datasource',
          typeName: 'Grafana API',
          typeLogoUrl: 'public/plugins/volkovlabs-grapi-datasource/img/logo.svg',
          access: 'proxy',
          url: '',
          user: '',
          database: '',
          basicAuth: false,
          isDefault: false,
          jsonData: {
            url: 'http://localhost:3000',
          },
          readOnly: false,
        },
        {
          id: 2,
          uid: 'timescale',
          orgId: 1,
          name: 'Timescale',
          type: 'postgres',
          typeName: 'PostgreSQL',
          typeLogoUrl: 'public/app/plugins/datasource/postgres/img/postgresql_logo.svg',
          access: 'proxy',
          url: 'host.docker.internal:5432',
          user: 'postgres',
          database: '',
          basicAuth: false,
          isDefault: false,
          jsonData: {
            postgresVersion: 1200,
            sslmode: 'disable',
          },
          readOnly: false,
        },
      ],
      headers: {},
      url: 'http://localhost:3000/api/datasources/proxy/1/api/datasources',
      type: 'basic',
      redirected: false,
      config: {
        method: 'GET',
        url: 'api/datasources/proxy/1/api/datasources',
        retry: 0,
        headers: {
          'X-Grafana-Org-Id': 1,
        },
        hideFromInspector: false,
      },
    };

    const query = { refId: 'A', requestType: RequestType.DATASOURCES };

    it('Should make getDataSources request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(response));
      let result = await getDataSources(api);
      expect(result).toBeTruthy();
    });

    it('Should not make getDataSources request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(undefined));
      jest.spyOn(console, 'error').mockImplementation();

      let result = await getDataSources(api);
      expect(result).toBeTruthy();
      expect(result.length).toBe(0);
    });

    it('Should throw exception getDataSources request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getErrorResponse(response));

      try {
        let result = await getDataSources(api);
        expect(result).toThrow(TypeError);
      } catch (e) {}
    });

    it('Should make getDataSourcesFrame request', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(response));
      let result = await getDataSourcesFrame(api, query);
      expect(result?.length).toEqual(1);
      expect(result[0].fields.length).toEqual(11);
      expect(result[0].fields[0].values.toArray()).toEqual([1, 2]);
    });

    it('Should handle getDataSourcesFrame request with no data', async () => {
      fetchRequestMock = jest.fn().mockImplementation(() => getResponse(response));
      response.data = [];
      jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(console, 'log').mockImplementation();

      let result = await getDataSourcesFrame(api, query);
      expect(result?.length).toEqual(0);
    });
  });
});
