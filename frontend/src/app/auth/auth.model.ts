export type Credentials = { usernameOrEmail: string; password: string };
export type RegisterPayload = { username: string; email: string; password: string };
export type AuthTokens = { accessToken: string };
export type AuthUser = { id: string; email: string; name: string; defaultCurrency?: string };
