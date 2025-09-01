import { TransactionTypeEnum } from "./transaction.model";

export interface DashboardOverviewResponseDTO {
  totalBalancePerCurrency: { [currencyCode: string]: number };
  totalIncomeThisMonth:  { [currencyCode: string]: number };
  totalExpenseThisMonth:  { [currencyCode: string]: number };
  upcomingRecurringCount: UpcomingRecurringTransactionModel[];
}

export interface CurrentBalanceResponseDTO {
  currencyCode: string;
  balance: number;
}

export interface TransactionsSummaryResponseDTO {
  groupedByMonth: any; // da dettagliare se serve
  groupedByCategory: any;
}

export interface IncomeExpenseBreakdownResponseDTO {
  transactionType: TransactionTypeEnum;
  macroCategory: string;
  currency: string;
  total: number;
}

export interface BalanceTrendPerCurrencyResponseDTO {
  currencyCode: string;
  trend: { month: string; cumulativeBalance: number }[];
}

export interface UpcomingRecurringTransactionModel {
  description: string;
  nextDate: string;
  amount: number;
}

export interface BalanceTrendResponseDTO {
  month: string,
  currency: string,
  balance: number
}
