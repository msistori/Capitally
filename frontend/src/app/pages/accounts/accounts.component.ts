import { Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable, of, Subscription, switchMap } from 'rxjs';
import { StorageService } from '../../auth/storage.service';
import { AccountModel } from '../../models/account.model';
import { CurrencyModel } from '../../models/currency.model';
import { TransactionModel, TransactionTypeEnum } from '../../models/transaction.model';
import { TransferModel, TransferRequestModel } from '../../models/transfer.model';
import { AccountService } from '../../services/account.service';
import { CurrencyService } from '../../services/currency.service';
import { FxRateService } from '../../services/fx-rate.service';
import { RefreshService } from '../../services/refresh.service';
import { TransactionService } from '../../services/transaction.service';
import { TransferService } from '../../services/transfer.service';
import { PRIVATE_ROUTES } from '../../routing/localized-routes';

type AccountsView = 'overview' | 'new-account' | 'new-transfer' | 'history';
type HistoryPeriod = '1m' | '3m' | '12m' | 'all';

interface AccountSummary {
  account: AccountModel;
  balances: Record<string, number>;
  balanceItems: AccountBalanceItem[];
  convertedBalance: number;
}

interface AccountBalanceItem {
  currency: string;
  amount: number;
}

type DesiredBalances = Record<string, number>;

const DEFAULT_ACCOUNT_ICON = 'account_balance_wallet';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent implements OnInit, OnDestroy {
  @ViewChild('accountTransactionsWarningTemplate') accountTransactionsWarningTemplate!: TemplateRef<unknown>;

  private storage = inject(StorageService);
  private accountService = inject(AccountService);
  private transactionService = inject(TransactionService);
  private transferService = inject(TransferService);
  private currencyService = inject(CurrencyService);
  private fxRateService = inject(FxRateService);
  private refreshService = inject(RefreshService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  private dialog = inject(MatDialog);
  public translateService = inject(TranslateService);

  readonly userId = Number(this.storage.getUserId() || 1);
  readonly iconOptions = [
    'account_balance_wallet',
    'credit_card',
    'account_balance',
    'savings',
    'trending_up',
    'payment',
    'attach_money',
    'local_atm',
    'work',
    'directions_car',
    'home',
    'group',
    'beach_access',
    'card_giftcard',
    'star'
  ];

  view: AccountsView = 'overview';
  defaultCurrency = this.storage.getDefaultCurrency();
  accounts: AccountModel[] = [];
  transactions: TransactionModel[] = [];
  allTransfers: TransferModel[] = [];
  transfers: TransferModel[] = [];
  currencies: CurrencyModel[] = [];
  accountSummaries: AccountSummary[] = [];
  rates: Record<string, number> = {};
  balancesVisible = this.storage.areBalancesVisible();
  editingAccountId: number | null = null;
  editingTransferGroupId: string | null = null;
  transferWeekDays: string[] = [];
  transferCalendarMatrix: Date[][] = [];
  private editingOriginalBalances: Record<string, number> = {};

  historyPeriodControl = new FormControl<HistoryPeriod>('3m', { nonNullable: true });

  accountForm = new FormGroup({
    iconName: new FormControl(DEFAULT_ACCOUNT_ICON, { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)]
    }),
    initialBalance: new FormControl<number | null>(null),
    currencyInitialBalanceCode: new FormControl(this.defaultCurrency, {
      nonNullable: true,
      validators: [Validators.required]
    }),
    excludeFromTotalBalance: new FormControl(false, { nonNullable: true }),
    balances: new FormArray<FormGroup>([])
  });

  transferForm = new FormGroup({
    sourceAccountId: new FormControl<number | null>(null, [Validators.required]),
    destinationAccountId: new FormControl<number | null>(null, [Validators.required]),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    currencyCode: new FormControl(this.defaultCurrency, { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl(this.formatDateInput(new Date()), { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(255)] })
  }, { validators: [this.differentAccountsValidator()] });

  private sub = new Subscription();

  ngOnInit(): void {
    this.loadCurrencies();
    this.loadRates();
    this.loadAccountsData();
    this.loadTransfers();
    this.refreshTransferWeekDays();
    this.buildTransferCalendarMatrix(this.parseDateInput(this.transferForm.controls.date.value));

    this.sub.add(this.route.queryParamMap.subscribe(params => {
      this.applyView(this.parseView(params.get('view')));
    }));

    this.sub.add(this.historyPeriodControl.valueChanges.subscribe(() => {
      this.applyTransferFilters();
    }));

    this.sub.add(this.transferForm.controls.date.valueChanges.subscribe(value => {
      this.buildTransferCalendarMatrix(this.parseDateInput(value));
    }));

    this.sub.add(this.storage.defaultCurrency$.subscribe(code => {
      this.defaultCurrency = code;
      this.accountForm.controls.currencyInitialBalanceCode.setValue(code);
      this.transferForm.controls.currencyCode.setValue(code);
      this.loadRates();
    }));

    this.sub.add(this.storage.balanceVisibility$.subscribe(visible => {
      this.balancesVisible = visible;
    }));

    this.sub.add(this.refreshService.onRefresh$.subscribe(() => {
      this.loadAccountsData();
      this.loadTransfers();
    }));

    this.sub.add(this.translateService.onLangChange.subscribe(() => {
      this.refreshTransferWeekDays();
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get titleKey(): string {
    if (this.view === 'new-account' && this.editingAccountId) {
      return 'ACCOUNTS.EDIT_ACCOUNT.TITLE';
    }

    if (this.view === 'new-transfer' && this.editingTransferGroupId) {
      return 'ACCOUNTS.TRANSFER.EDIT_TITLE';
    }

    const titles: Record<AccountsView, string> = {
      overview: 'ACCOUNTS.TITLE',
      'new-account': 'ACCOUNTS.NEW_ACCOUNT.TITLE',
      'new-transfer': 'ACCOUNTS.TRANSFER.TITLE',
      history: 'ACCOUNTS.HISTORY.TITLE'
    };

    return titles[this.view];
  }

  get balanceRows(): FormArray<FormGroup> {
    return this.accountForm.controls.balances as FormArray<FormGroup>;
  }

  get totalIncludedBalance(): number {
    return this.accountSummaries
      .filter(summary => summary.account.includeInTotalBalance !== false)
      .reduce((total, summary) => total + summary.convertedBalance, 0);
  }

  setView(view: AccountsView): void {
    this.router.navigate([PRIVATE_ROUTES.accounts], {
      queryParams: view === 'overview' ? {} : { view }
    });
  }

  editAccount(summary: AccountSummary): void {
    this.router.navigate([PRIVATE_ROUTES.accounts], {
      queryParams: { view: 'new-account', accountId: summary.account.id }
    });
  }

  editTransfer(transfer: TransferModel): void {
    this.router.navigate([PRIVATE_ROUTES.accounts], {
      queryParams: { view: 'new-transfer', transferGroupId: transfer.transferGroupId }
    });
  }

  private applyView(view: AccountsView): void {
    const changed = this.view !== view;
    this.view = view;

    if (view === 'new-account') {
      const accountId = Number(this.route.snapshot.queryParamMap.get('accountId'));
      if (accountId) {
        this.populateEditForm(accountId);
      } else if (changed || this.editingAccountId) {
        this.resetAccountForm();
      }
    }

    if (view === 'new-transfer') {
      const transferGroupId = this.route.snapshot.queryParamMap.get('transferGroupId');
      if (transferGroupId) {
        this.populateTransferForm(transferGroupId);
      } else if (changed || this.editingTransferGroupId) {
        this.resetTransferForm();
      }
    }

    if (view === 'history') {
      this.loadTransfers();
    }

    if (changed) {
      this.scrollToTop();
    }
  }

  selectIcon(icon: string): void {
    this.accountForm.controls.iconName.setValue(icon);
  }

  addBalanceRow(currencyCode = this.defaultCurrency, amount: number | null = null): void {
    this.balanceRows.push(this.createBalanceRow(currencyCode, amount));
  }

  removeBalanceRow(index: number): void {
    this.balanceRows.removeAt(index);
  }

  normalizeInitialBalanceInput(): void {
    this.normalizeAmountControl(this.accountForm.controls.initialBalance);
  }

  normalizeBalanceRowAmount(index: number): void {
    this.normalizeAmountControl(this.balanceRows.at(index)?.get('amount'));
  }

  submitAccount(): void {
    this.normalizeAccountAmounts();

    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const value = this.accountForm.getRawValue();
    const existingAccount = this.editingAccountId
      ? this.accounts.find(accountItem => accountItem.id === this.editingAccountId)
      : null;
    const desiredBalances = this.getDesiredBalances();
    const hasInitialBalance = this.hasInitialBalanceValue(value.initialBalance);
    const account: Partial<AccountModel> = {
      name: value.name.trim(),
      initialBalance: existingAccount
        ? existingAccount.initialBalance ?? null
        : hasInitialBalance ? Number(value.initialBalance) : null,
      currencyInitialBalanceCode: existingAccount
        ? existingAccount.currencyInitialBalanceCode ?? null
        : hasInitialBalance ? value.currencyInitialBalanceCode : null,
      iconName: value.iconName,
      includeInTotalBalance: !value.excludeFromTotalBalance,
      userId: this.userId
    };

    if (existingAccount) {
      const initialUpdate = this.buildEditedInitialBalance(existingAccount, desiredBalances);
      account.initialBalance = initialUpdate.initialBalance;
      account.currencyInitialBalanceCode = initialUpdate.currencyInitialBalanceCode;
    }

    const adjustmentBaseBalances = existingAccount
      ? this.getBalancesAfterAccountUpdate(existingAccount, account)
      : {};
    const request$: Observable<unknown> = this.editingAccountId
      ? this.accountService.putAccount(this.editingAccountId, account).pipe(
          switchMap(() => this.saveBalanceAdjustments(this.editingAccountId!, desiredBalances, adjustmentBaseBalances))
        )
      : this.accountService.postAccount(account);

    request$.subscribe({
      next: () => {
        this.loadAccountsData();
        this.refreshService.triggerRefresh();
        this.setView('overview');
      },
      error: (err: unknown) => console.error('Error saving account', err)
    });
  }

  deleteSelectedAccount(): void {
    if (!this.editingAccountId) {
      return;
    }

    const accountId = this.editingAccountId;

    this.transactionService.getTransactions(accountId).subscribe({
      next: transactions => {
        if (transactions.length) {
          this.openAccountTransactionsWarning();
          return;
        }

        this.deleteAccount(accountId);
      },
      error: err => console.error('Error checking account transactions', err)
    });
  }

  private deleteAccount(accountId: number): void {
    this.accountService.deleteAccount(accountId).subscribe({
      next: () => {
        this.loadAccountsData();
        this.refreshService.triggerRefresh();
        this.setView('overview');
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.openAccountTransactionsWarning();
          return;
        }

        console.error('Error deleting account', err);
      }
    });
  }

  submitTransfer(): void {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    const value = this.transferForm.getRawValue();

    if (!value.sourceAccountId || !value.destinationAccountId || !value.amount) {
      return;
    }

    const transfer: TransferRequestModel = {
      userId: this.userId,
      sourceAccountId: value.sourceAccountId,
      destinationAccountId: value.destinationAccountId,
      amount: Number(value.amount),
      currencyCode: value.currencyCode,
      date: value.date,
      description: value.description.trim() || undefined
    };

    const request$ = this.editingTransferGroupId
      ? this.transferService.putTransfer(this.editingTransferGroupId, transfer)
      : this.transferService.postTransfer(transfer);

    request$.subscribe({
      next: () => {
        this.loadAccountsData();
        this.loadTransfers();
        this.refreshService.triggerRefresh();
        this.setView('overview');
      },
      error: err => console.error('Error saving transfer', err)
    });
  }

  deleteSelectedTransfer(): void {
    if (!this.editingTransferGroupId) {
      return;
    }

    this.transferService.deleteTransfer(this.editingTransferGroupId).subscribe({
      next: () => {
        this.loadAccountsData();
        this.loadTransfers();
        this.refreshService.triggerRefresh();
        this.setView('history');
      },
      error: err => console.error('Error deleting transfer', err)
    });
  }

  loadTransfers(): void {
    this.transferService.getTransfers().subscribe({
      next: transfers => {
        this.allTransfers = transfers;
        this.applyTransferFilters();
        if (this.view === 'new-transfer' && this.editingTransferGroupId) {
          this.populateTransferForm(this.editingTransferGroupId);
        }
      },
      error: err => console.error('Error loading transfers', err)
    });
  }

  applyTransferFilters(): void {
    const range = this.getHistoryRange();

    this.transfers = this.allTransfers.filter(transfer => {
      if (!range.startDate || !range.endDate) {
        return true;
      }

      const date = new Date(`${transfer.date}T00:00:00`);
      const start = new Date(`${range.startDate}T00:00:00`);
      const end = new Date(`${range.endDate}T23:59:59`);
      return date >= start && date <= end;
    });
  }

  accountIcon(account: AccountModel): string {
    return account.iconName || DEFAULT_ACCOUNT_ICON;
  }

  transferSourceIcon(transfer: TransferModel): string {
    return transfer.sourceAccountIconName || DEFAULT_ACCOUNT_ICON;
  }

  transferDestinationIcon(transfer: TransferModel): string {
    return transfer.destinationAccountIconName || DEFAULT_ACCOUNT_ICON;
  }

  trackByAccount(_: number, summary: AccountSummary): number {
    return summary.account.id;
  }

  trackByTransfer(_: number, transfer: TransferModel): string {
    return transfer.transferGroupId;
  }

  trackByCurrency(_: number, currency: CurrencyModel): string {
    return currency.code;
  }

  trackByBalance(_: number, item: AccountBalanceItem): string {
    return item.currency;
  }

  trackByIcon(_: number, icon: string): string {
    return icon;
  }

  get currentTransferWeek(): Date[] {
    const selected = this.parseDateInput(this.transferForm.controls.date.value);
    return this.transferCalendarMatrix.find(week => week.some(day => this.sameDay(day, selected)))
      ?? this.transferCalendarMatrix[0]
      ?? [];
  }

  transferCalendarMonthLabel(): string {
    const locale = ({ it: 'it-IT', en: 'en-US' } as Record<string, string>)[this.translateService.currentLang] || 'it-IT';
    return this.parseDateInput(this.transferForm.controls.date.value)
      .toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }

  previousTransferWeek(): void {
    const selected = this.parseDateInput(this.transferForm.controls.date.value);
    selected.setDate(selected.getDate() - 7);
    this.transferForm.controls.date.setValue(this.formatDateInput(selected));
  }

  nextTransferWeek(): void {
    const selected = this.parseDateInput(this.transferForm.controls.date.value);
    selected.setDate(selected.getDate() + 7);
    this.transferForm.controls.date.setValue(this.formatDateInput(selected));
  }

  selectTransferDay(day: Date): void {
    this.transferForm.controls.date.setValue(this.formatDateInput(day));
  }

  isTransferDaySelected(day: Date): boolean {
    return this.sameDay(day, this.parseDateInput(this.transferForm.controls.date.value));
  }

  isTransferDayOutsideMonth(day: Date): boolean {
    const selected = this.parseDateInput(this.transferForm.controls.date.value);
    return day.getMonth() !== selected.getMonth()
      || day.getFullYear() !== selected.getFullYear();
  }

  private loadAccountsData(): void {
    forkJoin({
      accounts: this.accountService.getAccounts(),
      transactions: this.transactionService.getTransactions()
    }).subscribe({
      next: ({ accounts, transactions }) => {
        this.accounts = accounts
          .map(account => ({
            ...account,
            iconName: account.iconName || DEFAULT_ACCOUNT_ICON,
            includeInTotalBalance: account.includeInTotalBalance !== false
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        this.transactions = transactions;
        this.rebuildAccountSummaries();
        if (this.view === 'new-account' && this.editingAccountId) {
          this.populateEditForm(this.editingAccountId);
        }
      },
      error: err => console.error('Error loading account data', err)
    });
  }

  private loadCurrencies(): void {
    this.currencyService.getCurrencies().subscribe({
      next: currencies => this.currencies = currencies,
      error: err => console.error('Error loading currencies', err)
    });
  }

  private loadRates(): void {
    this.fxRateService.getRates(this.defaultCurrency).subscribe({
      next: rates => {
        this.rates = rates || {};
        this.rebuildAccountSummaries();
      },
      error: () => {
        this.rates = {};
        this.rebuildAccountSummaries();
      }
    });
  }

  private rebuildAccountSummaries(): void {
    const balancesByAccount = new Map<number, Record<string, number>>();

    for (const account of this.accounts) {
      const balances = balancesByAccount.get(account.id) ?? {};
      const currency = account.currencyInitialBalanceCode;

      if (currency) {
        balances[currency] = (balances[currency] ?? 0) + Number(account.initialBalance || 0);
      }

      balancesByAccount.set(account.id, balances);
    }

    for (const transaction of this.transactions) {
      const balances = balancesByAccount.get(transaction.accountId) ?? {};
      const currency = transaction.currencyCode;
      const amount = Number(transaction.amount || 0);
      const signedAmount = transaction.transactionType === TransactionTypeEnum.EXPENSE
        ? -amount
        : amount;

      balances[currency] = (balances[currency] ?? 0) + signedAmount;
      balancesByAccount.set(transaction.accountId, balances);
    }

    const lastUsageByAccountId = this.getLastUsageByAccountId();

    this.accountSummaries = this.accounts.map(account => {
      const balances = balancesByAccount.get(account.id) ?? {};

      return {
        account,
        balances,
        balanceItems: this.toBalanceItems(balances),
        convertedBalance: this.convertRecordToDefaultCurrency(balances)
      };
    }).sort((a, b) => this.compareAccountSummaries(a, b, lastUsageByAccountId));
  }

  private compareAccountSummaries(
    first: AccountSummary,
    second: AccountSummary,
    lastUsageByAccountId: Map<number, number>
  ): number {
    const balanceDifference = this.roundCurrencyAmount(second.convertedBalance)
      - this.roundCurrencyAmount(first.convertedBalance);

    if (balanceDifference !== 0) {
      return balanceDifference;
    }

    const firstLastUsage = lastUsageByAccountId.get(first.account.id) ?? 0;
    const secondLastUsage = lastUsageByAccountId.get(second.account.id) ?? 0;

    if (secondLastUsage !== firstLastUsage) {
      return secondLastUsage - firstLastUsage;
    }

    return first.account.name.localeCompare(second.account.name);
  }

  private getLastUsageByAccountId(): Map<number, number> {
    const lastUsageByAccountId = new Map<number, number>();

    for (const transaction of this.transactions) {
      const usageOrder = Number(transaction.id ?? 0);
      this.setAccountLastUsage(lastUsageByAccountId, transaction.accountId, usageOrder);
      this.setAccountLastUsage(lastUsageByAccountId, transaction.transferCounterpartyAccountId, usageOrder);
    }

    return lastUsageByAccountId;
  }

  private setAccountLastUsage(
    lastUsageByAccountId: Map<number, number>,
    accountId: number | undefined,
    usageOrder: number
  ): void {
    if (!accountId) {
      return;
    }

    lastUsageByAccountId.set(accountId, Math.max(lastUsageByAccountId.get(accountId) ?? 0, usageOrder));
  }

  private toBalanceItems(record: Record<string, number>): AccountBalanceItem[] {
    const entries = Object.entries(record)
      .filter(([, amount]) => Number.isFinite(amount))
        .map(([currency, amount]) => ({ currency, amount: this.roundCurrencyAmount(amount) }))
      .sort((a, b) => {
        if (a.currency === this.defaultCurrency) return -1;
        if (b.currency === this.defaultCurrency) return 1;
        return a.currency.localeCompare(b.currency);
      });

    return entries.length
      ? entries
      : [{ currency: this.defaultCurrency, amount: 0 }];
  }

  private convertRecordToDefaultCurrency(record: Record<string, number>): number {
    return Object.entries(record).reduce((sum, [currency, amount]) => {
      if (currency === this.defaultCurrency) {
        return sum + amount;
      }

      const rate = this.rates[currency];
      return rate && rate > 0 ? sum + amount / rate : sum;
    }, 0);
  }

  private resetAccountForm(): void {
    this.editingAccountId = null;
    this.editingOriginalBalances = {};
    this.balanceRows.clear();
    this.accountForm.reset({
      iconName: DEFAULT_ACCOUNT_ICON,
      name: '',
      initialBalance: null,
      currencyInitialBalanceCode: this.defaultCurrency,
      excludeFromTotalBalance: false
    });
  }

  private populateEditForm(accountId: number): void {
    const summary = this.accountSummaries.find(item => item.account.id === accountId);
    if (!summary) {
      this.editingAccountId = accountId;
      return;
    }

    this.editingAccountId = accountId;
    this.editingOriginalBalances = { ...summary.balances };
    this.balanceRows.clear();

    for (const item of summary.balanceItems) {
          this.addBalanceRow(item.currency, this.roundCurrencyAmount(item.amount));
    }

    this.accountForm.patchValue({
      iconName: this.accountIcon(summary.account),
      name: summary.account.name,
      initialBalance: Number(summary.account.initialBalance || 0),
      currencyInitialBalanceCode: summary.account.currencyInitialBalanceCode || this.defaultCurrency,
      excludeFromTotalBalance: summary.account.includeInTotalBalance === false
    });
  }

  private resetTransferForm(): void {
    this.editingTransferGroupId = null;
    this.transferForm.reset({
      sourceAccountId: null,
      destinationAccountId: null,
      amount: null,
      currencyCode: this.defaultCurrency,
      date: this.formatDateInput(new Date()),
      description: ''
    });
    this.buildTransferCalendarMatrix(this.parseDateInput(this.transferForm.controls.date.value));
  }

  private populateTransferForm(transferGroupId: string): void {
    const transfer = this.allTransfers.find(item => item.transferGroupId === transferGroupId);
    if (!transfer) {
      this.editingTransferGroupId = transferGroupId;
      return;
    }

    this.editingTransferGroupId = transferGroupId;
    this.transferForm.reset({
      sourceAccountId: transfer.sourceAccountId,
      destinationAccountId: transfer.destinationAccountId,
      amount: Number(transfer.amount),
      currencyCode: transfer.currencyCode,
      date: transfer.date,
      description: transfer.description ?? ''
    });
    this.buildTransferCalendarMatrix(this.parseDateInput(transfer.date));
  }

  private getHistoryRange(): { startDate?: string; endDate?: string } {
    const period = this.historyPeriodControl.value;

    if (period === 'all') {
      return {};
    }

    const end = new Date();
    const start = new Date(end);

    if (period === '1m') {
      start.setMonth(start.getMonth() - 1);
    } else if (period === '3m') {
      start.setMonth(start.getMonth() - 3);
    } else {
      start.setFullYear(start.getFullYear() - 1);
    }

    return {
      startDate: this.formatDateInput(start),
      endDate: this.formatDateInput(end)
    };
  }

  private parseView(value: string | null): AccountsView {
    return value === 'new-account' || value === 'new-transfer' || value === 'history'
      ? value
      : 'overview';
  }

  private hasInitialBalanceValue(value: number | null): boolean {
    return value !== null && Number.isFinite(Number(value));
  }

  private openAccountTransactionsWarning(): void {
    this.dialog.open(this.accountTransactionsWarningTemplate, {
      width: '420px',
      maxWidth: 'calc(100vw - 2rem)',
      panelClass: 'delete-dialog-template'
    });
  }

  private scrollToTop(): void {
    requestAnimationFrame(() => {
      const page = (this.host.nativeElement as HTMLElement).querySelector('.accounts-page') as HTMLElement | null;
      page?.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }

  private formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDateInput(value: string | null | undefined): Date {
    const parts = String(value ?? '').slice(0, 10).split('-').map(Number);
    if (parts.length === 3 && parts.every(part => Number.isFinite(part))) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    return new Date();
  }

  private buildTransferCalendarMatrix(date: Date): void {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysCount = new Date(year, month + 1, 0).getDate();
    const cells: Date[] = [];

    for (let index = startOffset - 1; index >= 0; index--) {
      cells.push(new Date(year, month, -index));
    }

    for (let day = 1; day <= daysCount; day++) {
      cells.push(new Date(year, month, day));
    }

    let nextDay = 1;
    while (cells.length % 7) {
      cells.push(new Date(year, month + 1, nextDay));
      nextDay++;
    }

    this.transferCalendarMatrix = [];
    for (let index = 0; index < cells.length; index += 7) {
      this.transferCalendarMatrix.push(cells.slice(index, index + 7));
    }
  }

  private refreshTransferWeekDays(): void {
    const weekDays = this.translateService.instant('FORM.WEEK_DAYS') as string[] | string;
    this.transferWeekDays = Array.isArray(weekDays)
      ? weekDays
      : ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];
  }

  private sameDay(first: Date, second: Date): boolean {
    return first.getDate() === second.getDate()
      && first.getMonth() === second.getMonth()
      && first.getFullYear() === second.getFullYear();
  }

  private createBalanceRow(currencyCode: string, amount: number | null): FormGroup {
    return new FormGroup({
      currencyCode: new FormControl(currencyCode, {
        nonNullable: true,
        validators: [Validators.required]
      }),
      amount: new FormControl(amount, {
        validators: [Validators.required]
      })
    });
  }

  private getDesiredBalances(): DesiredBalances {
    return this.balanceRows.controls.reduce((acc, row) => {
      const currencyCode = String(row.get('currencyCode')?.value || '').trim();
      const amount = this.roundCurrencyAmount(Number(row.get('amount')?.value || 0));

      if (currencyCode) {
        acc[currencyCode] = this.roundCurrencyAmount((acc[currencyCode] ?? 0) + amount);
      }

      return acc;
    }, {} as Record<string, number>);
  }

  private getBalancesAfterAccountUpdate(account: AccountModel, update: Partial<AccountModel>): DesiredBalances {
    const balances = { ...this.editingOriginalBalances };
    const previousCurrency = account.currencyInitialBalanceCode;
    const previousInitialBalance = Number(account.initialBalance || 0);
    const nextCurrency = update.currencyInitialBalanceCode;
    const nextInitialBalance = Number(update.initialBalance || 0);

    if (previousCurrency) {
      balances[previousCurrency] = (balances[previousCurrency] ?? 0) - previousInitialBalance;
    }

    if (nextCurrency && update.initialBalance != null) {
      balances[nextCurrency] = (balances[nextCurrency] ?? 0) + nextInitialBalance;
    }

    return balances;
  }

  private buildEditedInitialBalance(
    account: AccountModel,
    desiredBalances: DesiredBalances
  ): Pick<AccountModel, 'initialBalance' | 'currencyInitialBalanceCode'> {
    const currencyInitialBalanceCode = this.pickInitialBalanceCurrency(account, desiredBalances);

    if (!currencyInitialBalanceCode) {
      return { initialBalance: null, currencyInitialBalanceCode: null };
    }

    const transactionBalance = this.getTransactionBalance(account, currencyInitialBalanceCode);
    const desiredBalance = desiredBalances[currencyInitialBalanceCode] ?? 0;
    const initialBalance = Math.round((desiredBalance - transactionBalance) * 100) / 100;

    return { initialBalance, currencyInitialBalanceCode };
  }

  private pickInitialBalanceCurrency(account: AccountModel, desiredBalances: DesiredBalances): string | null {
    const currentCurrency = account.currencyInitialBalanceCode;

    if (currentCurrency && Object.prototype.hasOwnProperty.call(desiredBalances, currentCurrency)) {
      return currentCurrency;
    }

    return Object.keys(desiredBalances)[0] ?? null;
  }

  private getTransactionBalance(account: AccountModel, currencyCode: string): number {
    const totalBalance = this.editingOriginalBalances[currencyCode] ?? 0;

    if (account.currencyInitialBalanceCode !== currencyCode) {
      return totalBalance;
    }

    return totalBalance - Number(account.initialBalance || 0);
  }

  private normalizeAccountAmounts(): void {
    this.normalizeInitialBalanceInput();
    this.balanceRows.controls.forEach((_, index) => this.normalizeBalanceRowAmount(index));
  }

  private normalizeAmountControl(control: AbstractControl | null | undefined): void {
    if (!control) {
      return;
    }

    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return;
    }

    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return;
    }

    control.setValue(this.roundCurrencyAmount(amount), { emitEvent: false });
  }

  private roundCurrencyAmount(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  private saveBalanceAdjustments(
    accountId: number,
    desiredBalances: DesiredBalances,
    baseBalances: DesiredBalances
  ) {
    const currencies = new Set([
      ...Object.keys(baseBalances),
      ...Object.keys(desiredBalances)
    ]);
    const date = this.formatDateInput(new Date());
    const requests = Array.from(currencies)
      .map(currencyCode => {
        const current = baseBalances[currencyCode] ?? 0;
        const desired = desiredBalances[currencyCode] ?? 0;
        const difference = Math.round((desired - current) * 100) / 100;

        if (Math.abs(difference) < 0.01) {
          return null;
        }

        return this.transactionService.postTransaction({
          userId: this.userId,
          accountId,
          amount: Math.abs(difference),
          currencyCode,
          date,
          description: 'Balance adjustment',
          categoryId: null,
          transactionType: difference > 0 ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
          isRecurring: false,
          transferGroupId: this.buildAdjustmentGroupId()
        });
      })
      .filter((request): request is NonNullable<typeof request> => !!request);

    return requests.length ? forkJoin(requests) : of([]);
  }

  private buildAdjustmentGroupId(): string {
    const token = globalThis.crypto?.randomUUID?.()
      ?? `${Date.now()}${Math.random().toString(16).slice(2)}`;

    return `ADJ-${token.replace(/[^a-zA-Z0-9]/g, '')}`.slice(0, 36);
  }

  private differentAccountsValidator(): ValidatorFn {
    return (control): ValidationErrors | null => {
      const group = control as FormGroup;
      const sourceAccountId = group.get('sourceAccountId')?.value;
      const destinationAccountId = group.get('destinationAccountId')?.value;

      if (!sourceAccountId || !destinationAccountId) {
        return null;
      }

      return sourceAccountId === destinationAccountId ? { sameAccount: true } : null;
    };
  }
}
