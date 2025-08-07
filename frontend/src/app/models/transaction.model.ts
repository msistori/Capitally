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
  recurrenceInterval?: number;
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
  YEARLY = 'YEARLY'
}