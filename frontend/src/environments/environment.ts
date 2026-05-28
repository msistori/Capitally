export const environment = {
  production: false,
  apiBase: '/api',
  mockApi: {
    enabled: false,
    endpoints: {
      authLogin: true,
      authMe: true,
      dashboardOverview: true,
      dashboardBalanceTrend: true,
      dashboardIncomeExpenseBreakdown: true,
      dashboardAnnualIncomeExpense: true,
      dashboardUpcomingRecurring: true,
      transactions: true,
      categories: true,
      accounts: true,
      currencies: true,
      importExport: true,
      transfers: true
    }
  },
  auth: {
    loginUrl: '/oauth2/authorization/capitally',
    meUrl: '/auth/me',
    logoutUrl: '/logout',
    oidcLogoutUrl: '/logout-oidc'
  },
  demoUser: {
    usernameOrEmail: 'demo',
    password: ''
  }
};
