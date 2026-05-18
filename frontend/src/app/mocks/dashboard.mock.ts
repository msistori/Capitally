export const dashboardOverviewMock = {
  totalBalancePerCurrency: {
    EUR: 8534.05,
    USD: 1125.00
  },
  totalIncomeThisMonth: {
    EUR: 3800.00,
    USD: 150.00
  },
  totalExpenseThisMonth: {
    EUR: 175.00,
    USD: 25.00
  },
  upcomingRecurringCount: 0
};

export const balanceTrendMock = [
  { month: '2026-01', currency: 'EUR', balance: 0 },
  { month: '2026-01', currency: 'USD', balance: 0 },
  { month: '2026-02', currency: 'EUR', balance: 0 },
  { month: '2026-02', currency: 'USD', balance: 0 },
  { month: '2026-03', currency: 'EUR', balance: 0 },
  { month: '2026-03', currency: 'USD', balance: 0 },
  { month: '2026-04', currency: 'EUR', balance: 0 },
  { month: '2026-04', currency: 'USD', balance: 0 },
  { month: '2026-05', currency: 'EUR', balance: 0 },
  { month: '2026-05', currency: 'USD', balance: 0 }
];

export const incomeExpenseBreakdownMock = [
  { transactionType: 'INCOME', macroCategory: 'Lavoro', currency: 'EUR', total: 3800.00 },
  { transactionType: 'INCOME', macroCategory: 'Trasporti', currency: 'USD', total: 150.00 },
  { transactionType: 'EXPENSE', macroCategory: 'Cibo', currency: 'EUR', total: 25.00 },
  { transactionType: 'EXPENSE', macroCategory: 'Salute', currency: 'EUR', total: 15.00 },
  { transactionType: 'EXPENSE', macroCategory: 'Servizi', currency: 'EUR', total: 15.00 },
  { transactionType: 'EXPENSE', macroCategory: 'Shopping', currency: 'EUR', total: 15.00 },
  { transactionType: 'EXPENSE', macroCategory: 'Shopping', currency: 'USD', total: 25.00 },
  { transactionType: 'EXPENSE', macroCategory: 'Trasporti', currency: 'EUR', total: 100.00 },
  { transactionType: 'EXPENSE', macroCategory: 'Vizi', currency: 'EUR', total: 5.00 }
];

