import {
  createDataFrame,
  DataFrame,
  FieldType,
  formatLabels,
  Labels,
  ScopedVars,
  TimeRange,
  toDataFrame,
} from '@grafana/data';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { MESSAGES } from '../constants';
import {
  AlertRule,
  Annotation,
  AnnotationDashboard,
  AnnotationRange,
  AnnotationType,
  Query,
  RequestType,
} from '../types';
import { notifyError } from '../utils';
import { BaseApi } from './base';

/**
 * Annotations Api
 */
export class Annotations extends BaseApi {
  /**
   * Get Annotations
   */
  getAll = async (
    query: Query,
    range: TimeRange,
    dashboardUid: string | undefined,
    scopedVars: ScopedVars
  ): Promise<Annotation[]> => {
    const params: Record<string, unknown> = {};

    /**
     * Time Range
     */
    if (query.annotationRange === AnnotationRange.SELECTED) {
      params.from = range.from.valueOf();
      params.to = range.to.valueOf();
    }

    /**
     * Dashboard
     */
    if (query.annotationDashboard === AnnotationDashboard.THIS && dashboardUid) {
      params.dashboardUID = dashboardUid;
    }

    /**
     * Max Limit
     */
    if (query.annotationLimit) {
      params.limit = query.annotationLimit;
    }

    /**
     * Filter Type
     */
    if (query.annotationType === AnnotationType.ALERT) {
      params.type = AnnotationType.ALERT;
    } else if (query.annotationType === AnnotationType.ANNOTATION) {
      params.type = AnnotationType.ANNOTATION;
    }

    /**
     * Fetch
     */
    const response = await lastValueFrom(
      getBackendSrv().fetch({
        method: 'GET',
        params,
        url: `${this.api.instanceSettings.url}/api/annotations`,
      })
    );

    /**
     * Check Response
     */
    if (!response || !response.data) {
      notifyError([MESSAGES.error, MESSAGES.api.getAnnotationsFailed]);
      return [];
    }

    let annotations = response.data as Annotation[];

    /**
     * Filter Pattern
     */
    if (query.annotationPattern) {
      const pattern = getTemplateSrv().replace(query.annotationPattern, scopedVars);
      annotations = annotations.filter((annotation) => annotation.text?.match(pattern));
    }

    /**
     * Filter Prev State
     */
    if (query.annotationPrevState) {
      annotations = annotations.filter((annotation) => annotation.prevState === query.annotationPrevState);
    }

    /**
     * Filter New State
     */
    if (query.annotationNewState) {
      annotations = annotations.filter((annotation) => annotation.newState === query.annotationNewState);
    }

    return annotations;
  };

  /**
   * Get Annotations Frame
   */
  getFrame = async (
    query: Query,
    range: TimeRange,
    dashboardUid: string | undefined,
    scopedVars: ScopedVars
  ): Promise<DataFrame[]> => {
    const annotations = await this.getAll(query, range, dashboardUid, scopedVars);
    if (!annotations.length) {
      return [];
    }

    /**
     * Fields
     */
    const fields = [
      {
        name: 'Id',
        type: FieldType.number,
      },
      {
        name: 'Alert Id',
        type: FieldType.number,
      },
      {
        name: 'Dashboard Id',
        type: FieldType.number,
      },
      {
        name: 'Dashboard UID',
        type: FieldType.string,
      },
      {
        name: 'Panel Id',
        type: FieldType.number,
      },
      {
        name: 'Time',
        type: FieldType.time,
      },
      {
        name: 'Time End',
        type: FieldType.time,
      },
      {
        name: 'Login',
        type: FieldType.string,
      },
      {
        name: 'Email',
        type: FieldType.string,
      },
      {
        name: 'Avatar URL',
        type: FieldType.string,
      },
      {
        name: 'Tags',
        type: FieldType.string,
      },
      {
        name: 'Text',
        type: FieldType.string,
      },
      {
        name: 'Prev State',
        type: FieldType.string,
      },
      {
        name: 'New State',
        type: FieldType.string,
      },
      {
        name: 'Labels',
        type: FieldType.string,
      },
      {
        name: 'Values',
        type: FieldType.string,
      },
    ];

    /**
     * Alert Rules if enabled
     */
    const alertRules: { [id: number]: AlertRule } = {};
    if (query.annotationRules !== false && query.annotationType !== AnnotationType.ANNOTATION) {
      const rules = await this.api.features.provisioning.getAlertRules().catch(() => []);
      rules.forEach((rule) => (alertRules[rule.id] = rule));

      /**
       * Add fields
       */
      fields.push(
        {
          name: 'Alert Name',
          type: FieldType.string,
        },
        {
          name: 'Alert UID',
          type: FieldType.string,
        }
      );
    }

    /**
     * Create frame
     */
    let frame = createDataFrame({
      name: RequestType.ANNOTATIONS,
      refId: query.refId,
      fields,
    });

    /**
     * Fields for data
     */
    const frameFields = annotations.map((annotation) => {
      let formattedLabels = '{}';
      let formattedValues = '';
      const text = annotation.text?.match(/{([^}]+)} - ([^}]*)/);

      /**
       * Parse Labels
       */
      if (text?.length && text[1]) {
        const labels = {} as Labels;
        const pairs = text[1].split(', ');

        pairs.forEach((pair) => {
          const keyValue = pair.split('=');
          if (!keyValue.length) {
            return;
          }

          labels[keyValue[0]] = keyValue[1] || '';
        });

        formattedLabels = formatLabels(labels);
      }

      /**
       * Parse Values
       */
      if (text?.length && text[2]) {
        formattedValues = text[2];
      }
      const row = [
        annotation.id,
        annotation.alertId,
        annotation.dashboardId,
        annotation.dashboardUID,
        annotation.panelId,
        annotation.time,
        annotation.timeEnd,
        annotation.login,
        annotation.email,
        annotation.avatarUrl,
        annotation.tags?.join(','),
        annotation.text,
        annotation.prevState,
        annotation.newState,
        formattedLabels,
        formattedValues,
      ];

      if (query.annotationRules !== false && query.annotationType !== AnnotationType.ANNOTATION) {
        const alertTitle =
          annotation.alertId && alertRules[annotation.alertId] ? alertRules[annotation.alertId].title : '';
        const alertUid = annotation.alertId && alertRules[annotation.alertId] ? alertRules[annotation.alertId].uid : '';

        row.push(alertTitle, alertUid);
      }
      return row;
    });

    /**
     * Add Data
     */
    frame = {
      ...frame,
      fields: frame.fields.map((field, fieldIndex) => ({
        ...field,
        values: frameFields.map((dataField) => dataField[fieldIndex]),
      })),
      length: frameFields.length,
    };

    return [toDataFrame(frame)];
  };
}
