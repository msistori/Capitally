export type MockEndpointKey =
  | 'authLogin'
  | 'authMe'
  | 'dashboardOverview'
  | 'dashboardBalanceTrend'
  | 'dashboardIncomeExpenseBreakdown'
  | 'transactions'
  | 'categories'
  | 'accounts'
  | 'currencies'
  | 'importExport';

export interface MockApiConfig {
  enabled: boolean;
  endpoints: Record<MockEndpointKey, boolean>;
}
