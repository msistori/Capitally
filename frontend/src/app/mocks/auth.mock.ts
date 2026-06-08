export const MOCK_AUTH_STORAGE_KEY = 'cap_mock_auth_profile';

export type MockAuthProfile = 'guest' | 'account';

export const guestLoginResponse = {
  token: 'mock-guest-token',
  tokenType: 'Bearer',
  username: 'demo',
  email: 'demo@capitally.local',
  roles: ['USER', 'DEMO'],
  passwordChangeRequired: false
};

export const guestMeResponse = {
  id: 1,
  username: 'demo',
  email: 'demo@capitally.local',
  roles: ['USER', 'DEMO'],
  passwordChangeRequired: false
};

export const accountLoginResponse = {
  token: 'mock-account-token',
  tokenType: 'Bearer',
  username: 'Mattia',
  email: 'mattiasistori@gmail.com',
  roles: ['USER'],
  passwordChangeRequired: false
};

export const accountMeResponse = {
  id: 9,
  username: 'Mattia',
  email: 'mattiasistori@gmail.com',
  roles: ['USER'],
  passwordChangeRequired: false
};
