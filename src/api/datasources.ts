import { DataFrame, DataSourceSettings, FieldType } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { MESSAGES } from '../constants';
import { Query, RequestType } from '../types';
import { convertToFrame, notifyError } from '../utils';
import { BaseApi } from './base';

/**
 * Data Sources Api
 */
export class DataSources extends BaseApi {
  /**
   * Get Data Sources
   */
  getAll = async (): Promise<DataSourceSettings[]> => {
    /**
     * Fetch
     */
    const response = await lastValueFrom(
      getBackendSrv().fetch<DataSourceSettings[]>({
        method: 'GET',
        url: `${this.api.instanceSettings.url}/api/datasources`,
      })
    );

    /**
     * Check Response
     */
    if (!response || !response.data) {
      notifyError([MESSAGES.error, MESSAGES.api.getDataSourcesFailed]);
      return [];
    }

    return response.data;
  };

  /**
   * Get Data Sources Frame
   */
  getFrame = async (query: Query): Promise<DataFrame[]> => {
    const datasources = await this.getAll();
    if (!datasources.length) {
      return [];
    }

    /**
     * Create Frame
     */
    const frame = convertToFrame<DataSourceSettings>({
      name: RequestType.DATASOURCES,
      refId: query.refId,
      fields: [
        {
          name: 'Id',
          type: FieldType.number,
          getValue: (item) => item.id,
        },
        {
          name: 'Org Id',
          type: FieldType.number,
          getValue: (item) => item.orgId,
        },
        {
          name: 'UID',
          type: FieldType.string,
          getValue: (item) => item.uid,
        },
        {
          name: 'Name',
          type: FieldType.string,
          getValue: (item) => item.name,
        },
        {
          name: 'Type',
          type: FieldType.string,
          getValue: (item) => item.type,
        },
        {
          name: 'Type Logo URL',
          type: FieldType.string,
          getValue: (item) => item.typeLogoUrl,
        },
        {
          name: 'Type Name',
          type: FieldType.string,
          getValue: (item) => item.typeName,
        },
        {
          name: 'Is Default',
          type: FieldType.boolean,
          getValue: (item) => item.isDefault,
        },
        {
          name: 'Read Only',
          type: FieldType.boolean,
          getValue: (item) => item.readOnly,
        },
        {
          name: 'URL',
          type: FieldType.string,
          getValue: (item) => item.url,
        },
        {
          name: 'User',
          type: FieldType.string,
          getValue: (item) => item.user,
        },
      ],
      items: datasources,
    });

    return [frame];
  };
}
