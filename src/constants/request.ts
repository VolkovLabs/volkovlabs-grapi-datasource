import { SelectableValue } from '@grafana/data';

import { RequestType } from '../types';
import { MESSAGES } from './messages';

/**
 * Request Type
 *
 * @type {SelectableValue[]}
 */
export const REQUEST_TYPE_OPTIONS: Array<SelectableValue<RequestType>> = [
  {
    label: 'Alert Rules',
    description: MESSAGES.requestAlertRules,
    value: RequestType.ALERT_RULES,
  },
  {
    label: 'Grafana Alerts',
    description: MESSAGES.requestAlertingAlerts,
    value: RequestType.ALERTING_ALERTS,
  },
  {
    label: 'Annotations',
    description: MESSAGES.requestAnnotations,
    value: RequestType.ANNOTATIONS,
  },
  {
    label: 'Dashboards Metadata',
    description: MESSAGES.dashboardsMeta,
    value: RequestType.DASHBOARDS_META,
  },
  {
    label: 'Data Sources',
    description: MESSAGES.requestDataSources,
    value: RequestType.DATASOURCES,
  },
  {
    label: 'Health information',
    description: MESSAGES.requestHealth,
    value: RequestType.HEALTH,
  },
  {
    label: 'Organization Users',
    description: MESSAGES.requestOrgUsers,
    value: RequestType.ORG_USERS,
  },
  {
    label: 'None',
    description: MESSAGES.requestNone,
    value: RequestType.NONE,
  },
];

/**
 * Boolean Options
 */
export const BOOLEAN_OPTIONS: Array<SelectableValue<boolean>> = [
  {
    value: true,
    label: 'Enabled',
  },
  {
    value: false,
    label: 'Disabled',
  },
];
