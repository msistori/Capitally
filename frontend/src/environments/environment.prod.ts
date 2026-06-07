export const environment = {
  production: true,
  siteUrl: '',
  apiBase: '',
  mockApi: {
    enabled: false,
    endpoints: {
      authLogin: false,
      authMe: false,
      dashboardOverview: false,
      dashboardBalanceTrend: false,
      dashboardIncomeExpenseBreakdown: false,
      dashboardAnnualIncomeExpense: false,
      dashboardUpcomingRecurring: false,
      transactions: false,
      categories: false,
      accounts: false,
      currencies: false,
      importExport: false,
      transfers: false
    }
  },
  demoUser: {
    usernameOrEmail: '',
    password: ''
  }
};
