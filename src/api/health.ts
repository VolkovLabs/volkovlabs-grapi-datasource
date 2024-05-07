import { DataFrame, FieldType } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { MESSAGES } from '../constants';
import { Health as HealthType, Query, RequestType } from '../types';
import { convertToFrame, notifyError } from '../utils';
import { BaseApi } from './base';

/**
 * Health Api
 */
export class Health extends BaseApi {
  /**
   * Get Health
   */
  get = async (): Promise<HealthType | undefined> => {
    const response = await lastValueFrom(
      getBackendSrv().fetch<HealthType>({
        method: 'GET',
        url: `${this.api.instanceSettings.url}/api/health`,
      })
    );

    /**
     * Check Response
     */
    if (!response || !response.data) {
      notifyError([MESSAGES.error, MESSAGES.api.getHealthFailed]);
      return;
    }

    /**
     * Data received
     */
    return response.data;
  };

  /**
   * Get Health Frame
   */
  getFrame = async (query: Query): Promise<DataFrame[]> => {
    const health = await this.get();
    if (!health?.version) {
      return [];
    }

    /**
     * Create Frame
     */
    const frame = convertToFrame<HealthType>({
      name: RequestType.HEALTH,
      refId: query.refId,
      fields: [
        {
          name: 'Commit',
          type: FieldType.string,
          getValue: (item) => item.commit,
        },
        {
          name: 'Database',
          type: FieldType.string,
          getValue: (item) => item.database,
        },
        {
          name: 'Version',
          type: FieldType.string,
          getValue: (item) => item.version,
        },
      ],
      items: [health],
    });

    return [frame];
  };
}
