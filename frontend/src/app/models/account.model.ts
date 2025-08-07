export interface AccountModel {
  id: number;
  name: string;
  initialBalance: number;
  accountType: AccountTypeEnum;
  userId: number;
}

export enum AccountTypeEnum {
  CURRENT_ACCOUNT = 'CURRENT_ACCOUNT',
  SAVINGS_ACCOUNT = 'SAVINGS_ACCOUNT',
  INVESTMENT_ACCOUNT = 'INVESTMENT_ACCOUNT'
}