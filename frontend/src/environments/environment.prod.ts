export const environment = {
  production: true,
  mockApi: {
    enabled: false,
    endpoints: {
      authLogin: false,
      authMe: false,
      dashboardOverview: false,
      dashboardBalanceTrend: false,
      dashboardIncomeExpenseBreakdown: false,
      transactions: false,
      categories: false,
      accounts: false,
      currencies: false,
      importExport: false
    }
  },
  demoUser: {
    usernameOrEmail: '',
    password: ''
  }
};
