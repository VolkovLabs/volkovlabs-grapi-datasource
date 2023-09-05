import { lastValueFrom } from 'rxjs';
import { DataSourceSettings, FieldType, MutableDataFrame } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Messages, RequestType } from '../constants';
import { Query } from '../types';
import { notifyError } from '../utils';
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
      getBackendSrv().fetch({
        method: 'GET',
        url: `${this.api.instanceSettings.url}/api/datasources`,
      })
    );

    /**
     * Check Response
     */
    if (!response || !response.data) {
      notifyError([Messages.error, Messages.api.getDataSourcesFailed]);
      return [];
    }

    return response.data as DataSourceSettings[];
  };

  /**
   * Get Data Sources Frame
   */
  getFrame = async (query: Query): Promise<MutableDataFrame[]> => {
    const datasources = await this.getAll();
    if (!datasources.length) {
      return [];
    }

    /**
     * Create frame
     */
    const frame = new MutableDataFrame({
      name: RequestType.DATASOURCES,
      refId: query.refId,
      fields: [
        {
          name: 'Id',
          type: FieldType.number,
        },
        {
          name: 'Org Id',
          type: FieldType.number,
        },
        {
          name: 'UID',
          type: FieldType.string,
        },
        {
          name: 'Name',
          type: FieldType.string,
        },
        {
          name: 'Type',
          type: FieldType.string,
        },
        {
          name: 'Type Logo URL',
          type: FieldType.string,
        },
        {
          name: 'Type Name',
          type: FieldType.string,
        },
        {
          name: 'Is Default',
          type: FieldType.boolean,
        },
        {
          name: 'Read Only',
          type: FieldType.boolean,
        },
        {
          name: 'URL',
          type: FieldType.string,
        },
        {
          name: 'User',
          type: FieldType.string,
        },
      ],
    });

    /**
     * Add Data
     */
    datasources.forEach((datasource) => {
      frame.appendRow([
        datasource.id,
        datasource.orgId,
        datasource.uid,
        datasource.name,
        datasource.type,
        datasource.typeLogoUrl,
        datasource.typeName,
        datasource.isDefault,
        datasource.readOnly,
        datasource.url,
        datasource.user,
      ]);
    });

    return [frame];
  };
}
