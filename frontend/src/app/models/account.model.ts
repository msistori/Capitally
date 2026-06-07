export interface AccountModel {
  id: number;
  name: string;
  initialBalance?: number | null;
  currencyInitialBalanceCode?: string | null;
  iconName?: string | null;
  includeInTotalBalance?: boolean | null;
  userId: number;
}
