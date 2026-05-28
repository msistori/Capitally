export type MockEndpointKey =
  | 'authLogin'
  | 'authMe'
  | 'dashboardOverview'
  | 'dashboardBalanceTrend'
  | 'dashboardIncomeExpenseBreakdown'
  | 'dashboardAnnualIncomeExpense'
  | 'dashboardUpcomingRecurring'
  | 'transactions'
  | 'categories'
  | 'accounts'
  | 'currencies'
  | 'importExport'
  | 'transfers';

export interface MockApiConfig {
  enabled: boolean;
  endpoints: Record<MockEndpointKey, boolean>;
}
