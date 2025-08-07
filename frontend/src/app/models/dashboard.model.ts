export interface DashboardOverviewResponseDTO {
  totalBalancePerCurrency: { [currencyCode: string]: number };
  totalIncomeThisMonth: number;
  totalExpenseThisMonth: number;
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

export interface ExpenseBreakdownResponseDTO {
  macroCategory: string;
  currencyCode: string;
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
