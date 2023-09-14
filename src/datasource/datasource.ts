import {
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
} from '@grafana/data';
import { Api } from '../api';
import { DataSourceTestStatus, Messages, RequestMode, RequestType } from '../constants';
import { DataSourceOptions, Health, Query } from '../types';
import { VariableSupport } from './variable';

/**
 * Data Source
 */
export class DataSource extends DataSourceApi<Query, DataSourceOptions> {
  /**
   * Api
   *
   * @type {Api} api
   */
  api: Api;

  /**
   * Target Info
   */
  private targetInfo: { version: string } | undefined;

  /**
   * Get Target Promise
   */
  private getTargetPromise: Promise<[Health | undefined]> | null = null;

  /**
   * Constructor
   */
  constructor(private instanceSettings: DataSourceInstanceSettings<DataSourceOptions>) {
    super(instanceSettings);
    this.api = new Api({
      ...instanceSettings,
      url: instanceSettings.jsonData.requestMode === RequestMode.LOCAL ? '' : instanceSettings.url,
    });
    this.annotations = {};
    this.variables = new VariableSupport();
  }

  private async initApi() {
    /**
     * Get All Info for Initialization
     */
    this.getTargetPromise = Promise.all([this.api.features.health.get()]);

    const [health] = await this.getTargetPromise;

    if (!health) {
      throw new Error('Unable to get Health data.');
    }

    /**
     * Set Target Info
     */
    this.targetInfo = {
      version: health.version,
    };

    /**
     * Initialize API
     */
    this.api = new Api(
      {
        ...this.instanceSettings,
        url: this.instanceSettings.jsonData.requestMode === RequestMode.LOCAL ? '' : this.instanceSettings.url,
      },
      this.targetInfo
    );

    /**
     * Clear promise
     */
    this.getTargetPromise = null;
  }

  /**
   * Query
   */
  async query(options: DataQueryRequest<Query>): Promise<DataQueryResponse> {
    const data: DataFrame[] = [];
    const { range, dashboardUID } = options;

    if (!this.targetInfo) {
      if (!this.getTargetPromise) {
        await this.initApi();
      } else {
        await this.getTargetPromise;
      }
    }

    /**
     * Process targets
     */
    await Promise.all(
      options.targets.map(async (target) => {
        let frames: MutableDataFrame[] = [];

        /**
         * Request Types
         */
        switch (target.requestType) {
          case RequestType.ALERT_RULES:
            frames = await this.api.features.provisioning.getAlertRulesFrame(target);
            break;
          case RequestType.ANNOTATIONS:
            frames = await this.api.features.annotations.getFrame(target, range, dashboardUID, options.scopedVars);
            break;
          case RequestType.DATASOURCES:
            frames = await this.api.features.datasources.getFrame(target);
            break;
          case RequestType.HEALTH:
            frames = await this.api.features.health.getFrame(target);
            break;
          case RequestType.ORG_USERS:
            frames = await this.api.features.org.getUsersFrame(target);
            break;
        }

        if (!frames || !frames.length) {
          return;
        }

        /**
         * Add Frames
         */
        data.push(...frames);
      })
    );

    /**
     * Return data
     */
    return { data };
  }

  /**
   * Health Check
   */
  async testDatasource() {
    /**
     * Check Health
     */
    const health = await this.api.features.health.get();
    const org = await this.api.features.org.get();

    /**
     * Connected
     */
    if (health?.version && org?.name) {
      return {
        status: DataSourceTestStatus.SUCCESS,
        message: `${Messages.connectedToOrg} ${org.name}. ${Messages.version} ${health.version}`,
      };
    }

    /**
     * Return
     */
    return {
      status: DataSourceTestStatus.ERROR,
      message: Messages.connectionError,
    };
  }
}
