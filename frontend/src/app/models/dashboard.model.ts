import { RecurrencePeriodEnum, TransactionTypeEnum } from "./transaction.model";

export interface DashboardOverviewResponseDTO {
  totalBalancePerCurrency: { [currencyCode: string]: number };
  accountBalances: AccountBalanceResponseDTO[];
  totalIncomeThisMonth:  { [currencyCode: string]: number };
  totalExpenseThisMonth:  { [currencyCode: string]: number };
  upcomingRecurringCount: number;
}

export interface AccountBalanceResponseDTO {
  accountId: number;
  accountName: string;
  iconName?: string | null;
  currency: string;
  balance: number;
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

export interface AnnualIncomeExpenseResponseDTO {
  month: string;
  currency: string;
  income: number;
  expense: number;
}

export interface BalanceTrendPerCurrencyResponseDTO {
  currencyCode: string;
  trend: { month: string; cumulativeBalance: number }[];
}

export interface UpcomingRecurringTransactionModel {
  description?: string | null;
  amount: number;
  currency: string;
  nextDate: string;
  frequency: RecurrencePeriodEnum;
  category?: string | null;
  account?: string | null;
  transactionType?: TransactionTypeEnum;
}

export interface BalanceTrendResponseDTO {
  month: string,
  currency: string,
  balance: number
}
