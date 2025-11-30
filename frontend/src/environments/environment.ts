export const environment = {
  production: false,
  apiBase: '/api',
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
