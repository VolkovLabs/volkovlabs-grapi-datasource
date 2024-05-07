import { DataFrame, OrgProps } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { MESSAGES } from '../constants';
import { OrgUser, Query, RequestType } from '../types';
import { convertToFrame, getFieldsForItem, notifyError } from '../utils';
import { BaseApi } from './base';

/**
 * Org Api
 */
export class Org extends BaseApi {
  /**
   * Get Org
   */
  get = async (): Promise<OrgProps | undefined> => {
    const response = await lastValueFrom(
      getBackendSrv().fetch({
        method: 'GET',
        url: `${this.api.instanceSettings.url}/api/org`,
      })
    );

    /**
     * Check Response
     */
    if (!response || !response.data) {
      notifyError([MESSAGES.error, MESSAGES.api.getOrgFailed]);
      return;
    }

    /**
     * Data received
     */
    return response.data as OrgProps;
  };

  /**
   * Get Users
   */
  getUsers = async (): Promise<OrgUser[]> => {
    const response = await lastValueFrom(
      getBackendSrv().fetch<OrgUser[]>({
        method: 'GET',
        url: `${this.api.instanceSettings.url}/api/org/users`,
      })
    );

    /**
     * Check Response
     */
    if (!response || !response.data) {
      notifyError([MESSAGES.error, MESSAGES.api.getUsersFailed]);
      return [];
    }

    /**
     * Data received
     */
    return response.data;
  };

  /**
   * Get Users Frame
   */
  getUsersFrame = async (query: Query): Promise<DataFrame[]> => {
    const items = await this.getUsers();
    if (!items.length) {
      return [];
    }

    const frame = convertToFrame<OrgUser>({
      name: RequestType.ORG_USERS,
      refId: query.refId,
      fields: getFieldsForItem(items[0]),
      items,
    });

    return [frame];
  };
}
