export interface TransactionModel {
  userId: number;
  accountId: number;
  amount: number;
  currencyCode: string;
  date: Date;
  description?: string;
  categoryId: number;
  transactionType: TransactionTypeEnum;
  isRecurring?: boolean;
  recurrencePeriod?: RecurrencePeriodEnum;
  recurrenceEndDate?: Date;
}


export enum TransactionTypeEnum {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum RecurrencePeriodEnum {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  TWO_DAYS = 'TWO_DAYS',
  TEN_DAYS = 'TEN_DAYS',
  TWELVE_DAYS = 'TWELVE_DAYS',
  FIFTEEN_DAYS = 'FIFTEEN_DAYS',
  THIRTY_DAYS = 'THIRTY_DAYS',
  THIRTY_ONE_DAYS = 'THIRTY_ONE_DAYS',
  TWO_WEEKS = 'TWO_WEEKS',
  FOUR_WEEKS = 'FOUR_WEEKS',
  TWO_MONTHS = 'TWO_MONTHS',
  THREE_MONTHS = 'THREE_MONTHS',
  FOUR_MONTHS = 'FOUR_MONTHS',
  SIX_MONTHS = 'SIX_MONTHS',
  TWO_YEARS = 'TWO_YEARS'
}