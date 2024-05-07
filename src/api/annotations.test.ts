import { dateTime } from '@grafana/data';
import { Observable } from 'rxjs';

import { AnnotationDashboard, AnnotationRange, AnnotationType, Query, RequestType } from '../types';
import { createFeatureMethod } from '../utils';
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
  getTemplateSrv: () => ({
    replace: jest.fn((str) => str),
  }),
}));

/**
 * Time Range
 */
const range = {
  from: dateTime(),
  to: dateTime(),
  raw: {
    from: dateTime(),
    to: dateTime(),
  },
};

/**
 * Annotations API
 */
describe('Annotations Api', () => {
  const instanceSettings: any = {};

  /**
   * Api
   */
  const api = new Api(instanceSettings);

  /**
   * Get Annotations
   */
  describe('Get All', () => {
    const response = {
      status: 200,
      statusText: 'OK',
      ok: true,
      data: [
        {
          id: 5,
          alertId: 1,
          alertName: '',
          dashboardId: 1,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          dashboardUID: 'Rcb6nob4k',
          panelId: 2,
          userId: 0,
          newState: '',
          prevState: '',
          created: 1677686602468,
          updated: 1677686602468,
          time: 1677686216907,
          timeEnd: 1677686216907,
          text: '{aaa} - {bbb}',
          tags: ['value'],
          login: 'admin',
          email: 'admin@localhost',
          avatarUrl: '/avatar/46d229b033af06a191ff2267bca9ae56',
          data: {},
        },
      ],
      headers: {},
      url: 'http://localhost:3000/api/datasources/proxy/1/api/annotations',
      type: 'basic',
      redirected: false,
      config: {
        method: 'GET',
        url: 'api/datasources/proxy/1/api/annotations',
        retry: 0,
        headers: {
          'X-Grafana-Org-Id': 1,
        },
        hideFromInspector: false,
      },
    };

    const query: Query = {
      refId: 'A',
      requestType: RequestType.ANNOTATIONS,
      annotationRange: AnnotationRange.SELECTED,
      annotationDashboard: AnnotationDashboard.THIS,
      annotationLimit: 10,
      annotationType: AnnotationType.ANNOTATION,
    };

    it('Should make getAnnotations request', async () => {
      fetchRequestMock = jest.fn().mockImplementationOnce(() => getResponse(response));
      const result = await api.features.annotations.getAll(query, range, '123', {});

      expect(fetchRequestMock).toHaveBeenCalledWith({
        method: 'GET',
        params: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          dashboardUID: '123',
        }),
        url: expect.stringContaining('/api/annotations'),
      });
      expect(result).toBeTruthy();
    });

    it('Should make getAnnotations request for alerts', async () => {
      fetchRequestMock = jest.fn().mockImplementationOnce(() => getResponse(response));
      const result = await api.features.annotations.getAll(
        {
          ...query,
          annotationType: AnnotationType.ALERT,
        },
        range,
        '123',
        {}
      );

      expect(fetchRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            type: AnnotationType.ALERT,
          }),
        })
      );
      expect(result).toBeTruthy();
    });

    it('Should filter annotations by pattern and states', async () => {
      const prevState = 'prev';
      const newState = 'new';

      const validAnnotation = {
        text: '$name',
        prevState,
        newState,
      };
      const invalidAnnotation = {
        text: 'hello',
        prevState: '123',
        newState: '123',
      };

      fetchRequestMock = jest.fn().mockImplementationOnce(() =>
        getResponse({
          data: [validAnnotation, invalidAnnotation],
        })
      );

      const result = await api.features.annotations.getAll(
        {
          ...query,
          annotationPattern: /name/g as any,
          annotationPrevState: prevState as any,
          annotationNewState: newState as any,
        },
        range,
        '123',
        {}
      );

      expect(result).toEqual([validAnnotation]);
    });

    it('Should not make getAnnotations request', async () => {
      fetchRequestMock = jest.fn().mockImplementationOnce(() => getResponse(undefined));

      const result = await api.features.annotations.getAll(query, range, '', {});
      expect(result).toBeTruthy();
      expect(result.length).toBe(0);
    });

    it('Should throw exception getAnnotations request', async () => {
      fetchRequestMock = jest.fn().mockImplementationOnce(() => getErrorResponse());

      try {
        const result = await api.features.annotations.getAll(query, range, '', {});
        expect(result).toThrow(TypeError);
      } catch (e) {}
    });

    it('Should make getAnnotationsFrame request', async () => {
      fetchRequestMock = jest.fn().mockImplementationOnce(() => getResponse(response));
      const result = await api.features.annotations.getFrame(query, range, '', {});
      expect(result?.length).toEqual(1);
      expect(result[0].fields.length).toEqual(16);
      expect(result[0].fields[0].values).toEqual([5]);
    });

    it('Should handle getAnnotationsFrame request with no data', async () => {
      fetchRequestMock = jest.fn().mockImplementationOnce(() =>
        getResponse({
          ...response,
          data: [],
        })
      );

      const result = await api.features.annotations.getFrame(query, range, '', {});
      expect(result?.length).toEqual(0);
    });

    it('Should add alert rules', async () => {
      fetchRequestMock = jest.fn().mockImplementationOnce(() => getResponse(response));

      /**
       * Enable getAlertRules feature
       */
      const api = new Api(instanceSettings);
      api.features.provisioning.getAlertRules = jest.fn(() =>
        Promise.resolve([
          {
            id: 1,
            title: 'alert',
          },
        ])
      ) as any;

      const result = await api.features.annotations.getFrame(
        {
          ...query,
          annotationRules: true,
          annotationType: AnnotationType.ALL,
        },
        range,
        '',
        {}
      );

      expect(api.features.provisioning.getAlertRules).toHaveBeenCalled();
      expect(result?.length).toEqual(1);
      expect(result[0].fields.find((field) => field.name === 'Alert Name')?.values).toEqual(['alert']);
    });

    it('Should return result if alert rules feature disabled', async () => {
      fetchRequestMock = jest.fn().mockImplementationOnce(() => getResponse(response));

      /**
       * Disable getAlertRules feature
       */
      const api = new Api(instanceSettings);
      api.features.provisioning.getAlertRules = createFeatureMethod(jest.fn(), false);

      const result = await api.features.annotations.getFrame(
        {
          ...query,
          annotationRules: true,
          annotationType: AnnotationType.ALL,
        },
        range,
        '',
        {}
      );

      expect(result?.length).toEqual(1);
    });
  });
});
