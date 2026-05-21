export const environment = {
  production: true,
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
