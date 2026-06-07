import { Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { catchError, debounceTime, forkJoin, of, Subscription, switchMap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { StorageService } from '../../auth/storage.service';
import { AccountModel } from '../../models/account.model';
import { CategoryModel } from '../../models/category.model';
import { UpcomingRecurringTransactionModel } from '../../models/dashboard.model';
import { TransactionModel, TransactionTypeEnum } from '../../models/transaction.model';
import { AccountService } from '../../services/account.service';
import { CategoryService } from '../../services/category.service';
import { DashboardService } from '../../services/dashboard.service';
import { FxRateService } from '../../services/fx-rate.service';
import { RefreshService } from '../../services/refresh.service';
import { TransactionService } from '../../services/transaction.service';
import { AddTransactionModalComponent } from '../../components/insert-transaction/add-transaction-modal/add-transaction-modal.component';
import { ExportCsvDialogComponent } from '../../components/import-export/export-csv-dialog/export-csv-dialog.component';
import { TransactionExportFilterInputDTO } from '../../models/import-export-transactions.model';

type PeriodPreset = 'all' | 'current-month' | 'previous-month' | 'last-3-months' | 'current-year' | 'last-year' | 'two-years-ago' | 'custom';
type SummaryFilterType = 'period' | 'account' | 'category' | 'subcategory' | 'minAmount' | 'maxAmount';
type SummaryCalendarField = 'start' | 'end';
type BarChartData = ChartConfiguration<'bar'>['data'];
type DoughnutChartData = ChartConfiguration<'doughnut'>['data'];

interface DateRange {
  start: Date;
  end: Date;
}

interface TransactionRow {
  key: string;
  transaction: TransactionModel;
  description: string;
  amount: number;
  currencyCode: string;
  date: Date;
  accountName: string;
  categoryName: string;
  macroCategoryName: string;
  type: TransactionTypeEnum;
}

interface TopCategory {
  name: string;
  amount: number;
}

interface MostUsedAccount {
  name: string;
  count: number;
}

interface AccountBalance {
  account: AccountModel;
  convertedBalance: number;
}

interface SummaryCalendarDay {
  date: Date;
  label: number;
  outside: boolean;
  future: boolean;
  selected: boolean;
  inRange: boolean;
  today: boolean;
}

const DEFAULT_VISIBLE_TRANSACTIONS = 8;
const SUMMARY_FILTER_TRANSLATION_KEYS: Record<SummaryFilterType, string> = {
  period: 'SUMMARY.FILTERS.PERIOD',
  account: 'SUMMARY.FILTERS.ACCOUNT',
  category: 'SUMMARY.FILTERS.CATEGORY',
  subcategory: 'SUMMARY.FILTERS.SUBCATEGORY',
  minAmount: 'SUMMARY.FILTERS.MIN_AMOUNT',
  maxAmount: 'SUMMARY.FILTERS.MAX_AMOUNT'
};
const PERIOD_TRANSLATION_KEYS: Record<PeriodPreset, string> = {
  all: 'SUMMARY.PERIOD.ALL',
  'current-month': 'SUMMARY.PERIOD.CURRENT_MONTH',
  'previous-month': 'SUMMARY.PERIOD.PREVIOUS_MONTH',
  'last-3-months': 'SUMMARY.PERIOD.LAST_3_MONTHS',
  'current-year': 'SUMMARY.PERIOD.CURRENT_YEAR',
  'last-year': 'SUMMARY.PERIOD.LAST_YEAR',
  'two-years-ago': 'SUMMARY.PERIOD.TWO_YEARS_AGO',
  custom: 'SUMMARY.PERIOD.CUSTOM'
};

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit, OnDestroy {
  private storage = inject(StorageService);
  private accountService = inject(AccountService);
  private categoryService = inject(CategoryService);
  private dashboardService = inject(DashboardService);
  private transactionService = inject(TransactionService);
  private fxRateService = inject(FxRateService);
  private refreshService = inject(RefreshService);
  private dialog = inject(MatDialog);
  private host = inject(ElementRef<HTMLElement>);
  private translateService = inject(TranslateService);

  readonly userId = this.storage.getUserId() || '1';
  readonly TransactionTypeEnum = TransactionTypeEnum;

  filterTypeControl = new FormControl<SummaryFilterType>('period', { nonNullable: true });
  periodControl = new FormControl<PeriodPreset>('all', { nonNullable: true });
  customStartControl = new FormControl(this.formatDateInput(this.startOfMonth(new Date())), { nonNullable: true });
  customEndControl = new FormControl(this.formatDateInput(new Date()), { nonNullable: true });
  accountFilterControl = new FormControl('all', { nonNullable: true });
  macroCategoryFilterControl = new FormControl('all', { nonNullable: true });
  categoryFilterControl = new FormControl('all', { nonNullable: true });
  minAmountFilterControl = new FormControl<number | null>(null);
  maxAmountFilterControl = new FormControl<number | null>(null);
  searchControl = new FormControl('', { nonNullable: true });
  customCalendarField: SummaryCalendarField = 'start';
  customCalendarViewDate = this.startOfMonth(new Date());
  isCustomRangePopupOpen = false;
  summaryCalendarWeeks: SummaryCalendarDay[][] = [];
  summaryWeekDays: string[] = [];

  defaultCurrency = this.storage.getDefaultCurrency();
  accounts: AccountModel[] = [];
  categories: CategoryModel[] = [];
  transactions: TransactionModel[] = [];
  periodTransactions: TransactionModel[] = [];
  upcomingRecurringTransactions: UpcomingRecurringTransactionModel[] = [];
  transactionRows: TransactionRow[] = [];
  visibleTransactionRows: TransactionRow[] = [];
  visibleCount = DEFAULT_VISIBLE_TRANSACTIONS;

  totalBalance = 0;
  totalIncome = 0;
  totalExpense = 0;
  netBalance = 0;
  averageDailyExpense = 0;
  transactionCount = 0;
  previousNetDelta: number | null = null;
  topExpenseCategory: TopCategory | null = null;
  mostUsedAccount: MostUsedAccount | null = null;
  selectedRangeLabel = '';

  categoryChartData: BarChartData = { labels: [], datasets: [] };
  accountChartData: DoughnutChartData = { labels: [], datasets: [] };
  incomeExpenseChartData: DoughnutChartData = { labels: [], datasets: [] };
  categoryChartOptions: ChartOptions<'bar'> = {};
  doughnutChartOptions: ChartOptions<'doughnut'> = {};
  hasCategoryChartData = false;
  hasAccountChartData = false;
  hasIncomeExpenseChartData = false;

  private rates: Record<string, number> = {};
  private sub = new Subscription();
  private transactionDialogRef?: MatDialogRef<AddTransactionModalComponent, TransactionModel>;

  ngOnInit(): void {
    this.rebuildChartOptions();
    this.refreshSummaryCalendarLabels();
    this.rebuildSummaryCalendar();
    this.rebuildSummary();
    this.loadData();

    this.sub.add(this.filterTypeControl.valueChanges.subscribe(value => {
      if (value !== 'period') {
        this.closeCustomRangePopup();
      }
    }));

    this.sub.add(this.periodControl.valueChanges.subscribe(value => {
      this.visibleCount = DEFAULT_VISIBLE_TRANSACTIONS;
      if (value !== 'custom') {
        this.closeCustomRangePopup();
      }
      this.rebuildSummary();
    }));

    this.sub.add(this.customStartControl.valueChanges.subscribe(() => {
      this.rebuildSummaryCalendar();
      this.rebuildSummary();
    }));
    this.sub.add(this.customEndControl.valueChanges.subscribe(() => {
      this.rebuildSummaryCalendar();
      this.rebuildSummary();
    }));

    this.sub.add(this.accountFilterControl.valueChanges.subscribe(() => this.onSummaryFilterChange()));
    this.sub.add(this.macroCategoryFilterControl.valueChanges.subscribe(() => {
      this.ensureCategoryFilterMatchesMacro();
      this.onSummaryFilterChange();
    }));
    this.sub.add(this.categoryFilterControl.valueChanges.subscribe(() => this.onSummaryFilterChange()));
    this.sub.add(this.minAmountFilterControl.valueChanges.pipe(debounceTime(150)).subscribe(() => this.onSummaryFilterChange()));
    this.sub.add(this.maxAmountFilterControl.valueChanges.pipe(debounceTime(150)).subscribe(() => this.onSummaryFilterChange()));

    this.sub.add(this.searchControl.valueChanges.pipe(debounceTime(150)).subscribe(() => {
      this.visibleCount = DEFAULT_VISIBLE_TRANSACTIONS;
      this.applyTransactionSearch();
    }));

    this.sub.add(this.refreshService.onRefresh$.subscribe(() => this.loadData()));

    this.sub.add(this.storage.defaultCurrency$.pipe(
      switchMap(currency => {
        this.defaultCurrency = currency;
        return this.fxRateService.getRates(currency).pipe(catchError(() => of({} as Record<string, number>)));
      })
    ).subscribe(rates => {
      this.rates = rates || {};
      this.rebuildSummary();
    }));

    this.sub.add(this.translateService.onLangChange.subscribe(() => {
      this.rebuildChartOptions();
      this.refreshSummaryCalendarLabels();
      this.rebuildSummaryCalendar();
      this.rebuildSummary();
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get canLoadMore(): boolean {
    return this.visibleTransactionRows.length < this.transactionRows.length;
  }

  get macroCategoryOptions(): string[] {
    return Array.from(new Set(this.categories.map(category => category.macroCategory)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }

  get categoryFilterOptions(): CategoryModel[] {
    const selectedMacro = this.macroCategoryFilterControl.value;
    return this.categories
      .filter(category => selectedMacro === 'all' || category.macroCategory === selectedMacro)
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  get activeSummaryFilterCount(): number {
    return [
      this.periodControl.value !== 'all',
      this.accountFilterControl.value !== 'all',
      this.macroCategoryFilterControl.value !== 'all',
      this.categoryFilterControl.value !== 'all',
      this.parseOptionalAmount(this.minAmountFilterControl.value) !== null,
      this.parseOptionalAmount(this.maxAmountFilterControl.value) !== null
    ].filter(Boolean).length;
  }

  loadMoreTransactions(): void {
    this.visibleCount += DEFAULT_VISIBLE_TRANSACTIONS;
    this.applyTransactionSearch();
  }

  openNewTransaction(): void {
    this.openTransactionModal();
  }

  openEditTransaction(row: TransactionRow): void {
    this.openTransactionModal(row.transaction);
  }

  resetSummaryFilters(): void {
    this.filterTypeControl.setValue('period', { emitEvent: false });
    this.periodControl.setValue('all', { emitEvent: false });
    this.accountFilterControl.setValue('all', { emitEvent: false });
    this.macroCategoryFilterControl.setValue('all', { emitEvent: false });
    this.categoryFilterControl.setValue('all', { emitEvent: false });
    this.minAmountFilterControl.setValue(null, { emitEvent: false });
    this.maxAmountFilterControl.setValue(null, { emitEvent: false });
    this.searchControl.setValue('', { emitEvent: false });
    this.closeCustomRangePopup();
    this.visibleCount = DEFAULT_VISIBLE_TRANSACTIONS;
    this.rebuildSummary();
  }

  openSummaryExport(): void {
    const hasActiveFilters = this.hasActiveSummaryFilters();
    this.openExportDialog(hasActiveFilters ? this.buildCurrentExportFilter() : undefined, hasActiveFilters);
  }

  trackByTransaction(_: number, row: TransactionRow): string {
    return row.key;
  }

  trackByAccount(_: number, account: AccountModel): number {
    return account.id;
  }

  trackByCategory(_: number, category: CategoryModel): number | string {
    return category.id ?? `${category.macroCategory}-${category.category}`;
  }

  filterTypeSelectLabel(): string {
    return this.translateService.instant(SUMMARY_FILTER_TRANSLATION_KEYS[this.filterTypeControl.value]);
  }

  periodSelectLabel(): string {
    if (this.periodControl.value === 'custom') {
      const range = this.resolveCustomRange();
      return range ? this.buildRangeLabel(range) : this.translateService.instant(PERIOD_TRANSLATION_KEYS.custom);
    }

    return this.translateService.instant(PERIOD_TRANSLATION_KEYS[this.periodControl.value]);
  }

  onPeriodSelectionChange(value: PeriodPreset, select: MatSelect): void {
    if (value === 'custom') {
      setTimeout(() => {
        select.close();
        this.openCustomRangePopup();
      });
      return;
    }

    select.close();
  }

  onCustomPeriodOptionClick(select: MatSelect): void {
    if (this.periodControl.value !== 'custom') return;

    setTimeout(() => {
      select.close();
      this.openCustomRangePopup();
    });
  }

  selectCustomCalendarField(field: SummaryCalendarField): void {
    this.customCalendarField = field;
    this.syncCustomCalendarView();
  }

  previousCustomCalendarMonth(): void {
    this.customCalendarViewDate = new Date(
      this.customCalendarViewDate.getFullYear(),
      this.customCalendarViewDate.getMonth() - 1,
      1
    );
    this.rebuildSummaryCalendar();
  }

  nextCustomCalendarMonth(): void {
    if (this.isNextCustomCalendarMonthDisabled()) return;

    this.customCalendarViewDate = new Date(
      this.customCalendarViewDate.getFullYear(),
      this.customCalendarViewDate.getMonth() + 1,
      1
    );
    this.rebuildSummaryCalendar();
  }

  previousCustomCalendarYear(): void {
    this.customCalendarViewDate = new Date(
      this.customCalendarViewDate.getFullYear() - 1,
      this.customCalendarViewDate.getMonth(),
      1
    );
    this.rebuildSummaryCalendar();
  }

  nextCustomCalendarYear(): void {
    if (this.isNextCustomCalendarYearDisabled()) return;

    this.customCalendarViewDate = new Date(
      this.customCalendarViewDate.getFullYear() + 1,
      this.customCalendarViewDate.getMonth(),
      1
    );
    this.rebuildSummaryCalendar();
  }

  isNextCustomCalendarMonthDisabled(): boolean {
    const nextMonth = this.startOfMonth(new Date(
      this.customCalendarViewDate.getFullYear(),
      this.customCalendarViewDate.getMonth() + 1,
      1
    ));
    return nextMonth > this.startOfMonth(new Date());
  }

  isNextCustomCalendarYearDisabled(): boolean {
    const nextYear = this.startOfMonth(new Date(
      this.customCalendarViewDate.getFullYear() + 1,
      this.customCalendarViewDate.getMonth(),
      1
    ));
    return nextYear > this.startOfMonth(new Date());
  }

  selectSummaryCalendarDay(day: SummaryCalendarDay): void {
    if (day.future) return;

    const selectedDate = this.formatDateInput(day.date);

    if (this.customCalendarField === 'start') {
      this.customStartControl.setValue(selectedDate);

      const currentEnd = this.parseInputDate(this.customEndControl.value);
      if (currentEnd && day.date > currentEnd) {
        this.customEndControl.setValue(selectedDate);
      }

      this.customCalendarField = 'end';
      return;
    }

    this.customEndControl.setValue(selectedDate);

    const currentStart = this.parseInputDate(this.customStartControl.value);
    if (currentStart && day.date < currentStart) {
      this.customStartControl.setValue(selectedDate);
    }

    this.closeCustomRangePopup();
  }

  customCalendarMonthLabel(): string {
    const locale = ({ it: 'it-IT', en: 'en-US' } as Record<string, string>)[this.translateService.currentLang] || 'it-IT';
    return this.customCalendarViewDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }

  customDateLabel(field: SummaryCalendarField): string {
    const value = field === 'start' ? this.customStartControl.value : this.customEndControl.value;
    const date = this.parseInputDate(value);
    return date
      ? date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '--/--/----';
  }

  trackByCalendarWeek(index: number): number {
    return index;
  }

  trackByCalendarDay(_: number, day: SummaryCalendarDay): string {
    return `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;
  }

  private loadData(): void {
    forkJoin({
      accounts: this.accountService.getAccounts(),
      categories: this.categoryService.getCategories(),
      transactions: this.transactionService.getTransactions(),
      upcomingRecurring: this.dashboardService.getUpcomingRecurringTransactions(
        this.upcomingRecurringUntilDate()
      ).pipe(catchError(() => of([] as UpcomingRecurringTransactionModel[])))
    }).subscribe({
      next: ({ accounts, categories, transactions, upcomingRecurring }) => {
        this.accounts = accounts
          .map(account => ({
            ...account,
            includeInTotalBalance: account.includeInTotalBalance !== false
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        this.categories = categories;
        this.transactions = [...transactions].sort((a, b) => {
          return this.toLocalDate(b.date).getTime() - this.toLocalDate(a.date).getTime();
        });
        this.upcomingRecurringTransactions = [...upcomingRecurring]
          .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
        this.rebuildSummary();
      },
      error: err => console.error('Error loading summary data', err)
    });
  }

  private refreshSummaryCalendarLabels(): void {
    const weekDays = this.translateService.instant('FORM.WEEK_DAYS') as string[] | string;
    this.summaryWeekDays = Array.isArray(weekDays)
      ? weekDays
      : ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];
  }

  private syncCustomCalendarView(): void {
    const value = this.customCalendarField === 'start'
      ? this.customStartControl.value
      : this.customEndControl.value;
    const date = this.parseInputDate(value) ?? new Date();

    this.customCalendarViewDate = this.startOfMonth(this.clampToToday(date));
    this.rebuildSummaryCalendar();
  }

  private openCustomRangePopup(): void {
    this.isCustomRangePopupOpen = true;
    this.syncCustomCalendarView();
  }

  private closeCustomRangePopup(): void {
    this.isCustomRangePopupOpen = false;
  }

  private rebuildSummaryCalendar(): void {
    const year = this.customCalendarViewDate.getFullYear();
    const month = this.customCalendarViewDate.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startOffset);
    const today = this.stripTime(new Date());
    const range = this.resolveCustomRange();
    const weeks: SummaryCalendarDay[][] = [];

    for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
      const week: SummaryCalendarDay[] = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(
          gridStart.getFullYear(),
          gridStart.getMonth(),
          gridStart.getDate() + weekIndex * 7 + dayIndex
        );
        const strippedDate = this.stripTime(date);

        week.push({
          date,
          label: date.getDate(),
          outside: date.getMonth() !== month,
          future: strippedDate > today,
          selected: !!range && (this.sameDay(strippedDate, range.start) || this.sameDay(strippedDate, range.end)),
          inRange: !!range && strippedDate >= range.start && strippedDate <= range.end,
          today: this.sameDay(strippedDate, today)
        });
      }

      weeks.push(week);
    }

    this.summaryCalendarWeeks = weeks;
  }

  private resolveCustomRange(): DateRange | null {
    const rawStart = this.parseInputDate(this.customStartControl.value);
    const rawEnd = this.parseInputDate(this.customEndControl.value);

    if (!rawStart || !rawEnd) {
      return null;
    }

    const start = this.clampToToday(rawStart);
    const end = this.clampToToday(rawEnd);

    return start <= end ? { start, end } : { start: end, end: start };
  }

  private rebuildSummary(): void {
    const range = this.resolveRange();
    this.selectedRangeLabel = this.buildRangeLabel(range);
    this.periodTransactions = this.transactions.filter(transaction => this.matchesSummaryFilters(transaction, range));
    const actualTransactions = this.nonTransferTransactions(this.periodTransactions);

    this.totalIncome = this.sumTransactions(actualTransactions, TransactionTypeEnum.INCOME);
    this.totalExpense = this.sumTransactions(actualTransactions, TransactionTypeEnum.EXPENSE);
    this.netBalance = this.totalIncome - this.totalExpense;
    this.transactionCount = actualTransactions.length;
    this.topExpenseCategory = this.findTopExpenseCategory(actualTransactions);
    this.mostUsedAccount = this.findMostUsedAccount(actualTransactions);

    const statsRange = this.resolveStatsRange(range, actualTransactions);
    this.averageDailyExpense = this.totalExpense / this.countDays(statsRange);
    this.previousNetDelta = range ? this.calculatePreviousNetDelta(range) : null;
    this.totalBalance = this.calculateTotalBalance(range);

    this.buildCategoryChart(actualTransactions);
    this.buildAccountChart(range);
    this.buildIncomeExpenseChart();
    this.applyTransactionSearch();
  }

  private onSummaryFilterChange(): void {
    this.visibleCount = DEFAULT_VISIBLE_TRANSACTIONS;
    this.rebuildSummary();
  }

  private applyTransactionSearch(): void {
    const search = this.searchControl.value.trim().toLowerCase();
    const rows = this.nonTransferTransactions(this.periodTransactions)
      .map(transaction => this.toTransactionRow(transaction))
      .filter(row => {
        if (!search) return true;

        return row.description.toLowerCase().includes(search)
          || row.accountName.toLowerCase().includes(search)
          || row.categoryName.toLowerCase().includes(search);
      });

    this.transactionRows = rows;
    this.visibleTransactionRows = rows.slice(0, this.visibleCount);
  }

  private openTransactionModal(transaction?: TransactionModel): void {
    if (this.transactionDialogRef) return;

    this.transactionDialogRef = this.dialog.open(AddTransactionModalComponent, {
      hasBackdrop: true,
      disableClose: false,
      closeOnNavigation: true,
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'add-transaction-modal-panel',
      data: transaction ? { transaction } : undefined
    });

    this.transactionDialogRef.afterClosed().subscribe(tx => {
      this.transactionDialogRef = undefined;
      if (tx) {
        this.refreshService.triggerRefresh();
      }
    });
  }

  private openExportDialog(initialFilter?: TransactionExportFilterInputDTO, hasActiveFilters = false): void {
    this.dialog.open(ExportCsvDialogComponent, {
      width: '640px',
      maxWidth: 'calc(100vw - 2rem)',
      panelClass: 'export-csv-dialog',
      disableClose: false,
      data: {
        confirmationMode: true,
        hasActiveFilters,
        initialFilter
      }
    });
  }

  private resolveRange(): DateRange | null {
    const today = this.stripTime(new Date());
    const preset = this.periodControl.value;

    if (preset === 'all') {
      return null;
    }

    if (preset === 'current-month') {
      return { start: this.startOfMonth(today), end: today };
    }

    if (preset === 'previous-month') {
      const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return {
        start: this.startOfMonth(previousMonth),
        end: new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0)
      };
    }

    if (preset === 'last-3-months') {
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 2, 1),
        end: today
      };
    }

    if (preset === 'current-year') {
      return { start: new Date(today.getFullYear(), 0, 1), end: today };
    }

    if (preset === 'last-year') {
      const year = today.getFullYear() - 1;
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
    }

    if (preset === 'two-years-ago') {
      const year = today.getFullYear() - 2;
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
    }

    return this.resolveCustomRange();
  }

  private resolveStatsRange(range: DateRange | null, transactions: TransactionModel[]): DateRange {
    if (range) return range;

    const dates = transactions.map(transaction => this.toLocalDate(transaction.date));
    if (!dates.length) {
      const today = this.stripTime(new Date());
      return { start: today, end: today };
    }

    const timestamps = dates.map(date => date.getTime());
    return {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps))
    };
  }

  private buildRangeLabel(range: DateRange | null): string {
    if (!range) {
      return this.translateService.instant('SUMMARY.PERIOD.ALL');
    }

    const start = range.start.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const end = range.end.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${start} - ${end}`;
  }

  private isInRange(transaction: TransactionModel, range: DateRange | null): boolean {
    if (!range) return true;

    const date = this.toLocalDate(transaction.date);
    return date >= range.start && date <= range.end;
  }

  private matchesSummaryFilters(transaction: TransactionModel, range: DateRange | null): boolean {
    if (!this.isInRange(transaction, range)) return false;

    const selectedAccountId = this.accountFilterControl.value;
    if (selectedAccountId !== 'all') {
      const accountId = Number(selectedAccountId);
      const matchesAccount = Number(transaction.accountId) === accountId
        || Number(transaction.transferCounterpartyAccountId) === accountId;
      if (!matchesAccount) return false;
    }

    const amount = this.toDefaultCurrency(Number(transaction.amount || 0), transaction.currencyCode);
    const minAmount = this.parseOptionalAmount(this.minAmountFilterControl.value);
    const maxAmount = this.parseOptionalAmount(this.maxAmountFilterControl.value);

    if (minAmount !== null && amount < minAmount) return false;
    if (maxAmount !== null && amount > maxAmount) return false;

    const selectedMacro = this.macroCategoryFilterControl.value;
    const selectedCategoryId = this.categoryFilterControl.value;
    const category = this.transactionCategory(transaction);

    if (selectedMacro !== 'all' && category?.macroCategory !== selectedMacro) return false;
    if (selectedCategoryId !== 'all' && Number(transaction.categoryId) !== Number(selectedCategoryId)) return false;

    return true;
  }

  private sumTransactions(transactions: TransactionModel[], type: TransactionTypeEnum): number {
    return transactions
      .filter(transaction => transaction.transactionType === type)
      .reduce((sum, transaction) => {
        return sum + this.toDefaultCurrency(Number(transaction.amount || 0), transaction.currencyCode);
      }, 0);
  }

  private findTopExpenseCategory(transactions: TransactionModel[]): TopCategory | null {
    const totals = new Map<string, number>();

    for (const transaction of transactions) {
      if (transaction.transactionType !== TransactionTypeEnum.EXPENSE) continue;

      const category = this.categoryName(transaction);
      const amount = this.toDefaultCurrency(Number(transaction.amount || 0), transaction.currencyCode);
      totals.set(category, (totals.get(category) ?? 0) + amount);
    }

    const top = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: top[0], amount: top[1] } : null;
  }

  private findMostUsedAccount(transactions: TransactionModel[]): MostUsedAccount | null {
    const counts = new Map<number, number>();

    for (const transaction of transactions) {
      counts.set(transaction.accountId, (counts.get(transaction.accountId) ?? 0) + 1);
    }

    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;

    return {
      name: this.accountName(top[0]),
      count: top[1]
    };
  }

  private calculatePreviousNetDelta(range: DateRange): number {
    const days = this.countDays(range);
    const previousEnd = new Date(range.start);
    previousEnd.setDate(previousEnd.getDate() - 1);

    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousEnd.getDate() - days + 1);

    const previousRange = { start: previousStart, end: previousEnd };
    const previousTransactions = this.nonTransferTransactions(
      this.transactions.filter(transaction => this.isInRange(transaction, previousRange))
    );
    const previousIncome = this.sumTransactions(previousTransactions, TransactionTypeEnum.INCOME);
    const previousExpense = this.sumTransactions(previousTransactions, TransactionTypeEnum.EXPENSE);

    return this.netBalance - (previousIncome - previousExpense);
  }

  private calculateTotalBalance(range: DateRange | null): number {
    const selectedAccountId = this.accountFilterControl.value;

    return this.calculateAccountBalances(range)
      .filter(item => item.account.includeInTotalBalance !== false)
      .filter(item => selectedAccountId === 'all' || item.account.id === Number(selectedAccountId))
      .reduce((total, item) => total + item.convertedBalance, 0);
  }

  private calculateAccountBalances(range: DateRange | null): AccountBalance[] {
    const end = range?.end ?? null;
    const balancesByAccount = new Map<number, Record<string, number>>();

    for (const account of this.accounts) {
      const balances: Record<string, number> = {};
      const currency = account.currencyInitialBalanceCode || this.defaultCurrency;
      balances[currency] = Number(account.initialBalance || 0);
      balancesByAccount.set(account.id, balances);
    }

    for (const transaction of this.transactions) {
      if (end && this.toLocalDate(transaction.date) > end) continue;

      const balances = balancesByAccount.get(transaction.accountId) ?? {};
      const currency = transaction.currencyCode || this.defaultCurrency;
      const amount = Number(transaction.amount || 0);
      const signedAmount = transaction.transactionType === TransactionTypeEnum.EXPENSE ? -amount : amount;

      balances[currency] = (balances[currency] ?? 0) + signedAmount;
      balancesByAccount.set(transaction.accountId, balances);
    }

    return this.accounts.map(account => ({
      account,
      convertedBalance: this.convertRecordToDefaultCurrency(balancesByAccount.get(account.id) ?? {})
    }));
  }

  private buildCategoryChart(transactions: TransactionModel[]): void {
    const totals = new Map<string, { income: number; expense: number }>();

    for (const transaction of transactions) {
      if (this.isTransferTransaction(transaction)) continue;

      const category = this.categoryName(transaction);
      const current = totals.get(category) ?? { income: 0, expense: 0 };
      const amount = this.toDefaultCurrency(Number(transaction.amount || 0), transaction.currencyCode);

      if (transaction.transactionType === TransactionTypeEnum.INCOME) {
        current.income += amount;
      } else {
        current.expense += amount;
      }

      totals.set(category, current);
    }

    const rows = Array.from(totals.entries())
      .map(([category, values]) => ({
        category,
        income: this.roundAmount(values.income),
        expense: this.roundAmount(values.expense),
        total: values.income + values.expense
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    this.hasCategoryChartData = rows.some(row => row.income > 0 || row.expense > 0);
    this.categoryChartData = {
      labels: rows.map(row => row.category),
      datasets: [
        {
          label: this.translateService.instant('SUMMARY.CHARTS.INCOME'),
          data: rows.map(row => row.income),
          backgroundColor: this.cssVar('--summary-income-chart'),
          borderColor: this.cssVar('--summary-income'),
          borderRadius: 7,
          maxBarThickness: 28
        },
        {
          label: this.translateService.instant('SUMMARY.CHARTS.EXPENSE'),
          data: rows.map(row => row.expense),
          backgroundColor: this.cssVar('--summary-expense-chart'),
          borderColor: this.cssVar('--summary-expense'),
          borderRadius: 7,
          maxBarThickness: 28
        }
      ]
    };
  }

  private buildAccountChart(range: DateRange | null): void {
    const palette = this.chartPalette();
    const selectedAccountId = this.accountFilterControl.value;
    const balances = this.calculateAccountBalances(range)
      .filter(item => selectedAccountId === 'all' || item.account.id === Number(selectedAccountId))
      .map(item => ({
        label: item.account.name,
        value: this.roundAmount(item.convertedBalance)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    this.hasAccountChartData = balances.length > 0;
    this.accountChartData = {
      labels: balances.map(item => item.label),
      datasets: [{
        data: balances.map(item => item.value),
        backgroundColor: balances.map((_, index) => palette[index % palette.length]),
        borderWidth: 0,
        hoverOffset: 6
      }]
    };
  }

  private buildIncomeExpenseChart(): void {
    this.hasIncomeExpenseChartData = this.totalIncome > 0 || this.totalExpense > 0;
    this.incomeExpenseChartData = {
      labels: [
        this.translateService.instant('SUMMARY.CHARTS.INCOME'),
        this.translateService.instant('SUMMARY.CHARTS.EXPENSE')
      ],
      datasets: [{
        data: [this.roundAmount(this.totalIncome), this.roundAmount(this.totalExpense)],
        backgroundColor: [
          this.cssVar('--summary-income-chart'),
          this.cssVar('--summary-expense-chart')
        ],
        borderWidth: 0,
        hoverOffset: 6
      }]
    };
  }

  private rebuildChartOptions(): void {
    const primary = this.cssVar('--summary-primary');
    const grid = this.cssVar('--summary-grid');

    this.categoryChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: primary,
            usePointStyle: true,
            pointStyle: 'roundedRect'
          }
        },
        tooltip: {
          callbacks: {
            label: context => {
              const label = context.dataset.label ?? '';
              const value = Number(context.parsed.y || 0);
              return `${label}: ${this.formatCurrency(value)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: primary, minRotation: 35, maxRotation: 45, autoSkip: false },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: primary,
            callback: value => this.formatCurrency(Number(value))
          },
          grid: { color: grid }
        }
      }
    };

    this.doughnutChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: primary,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 14
          }
        },
        tooltip: {
          callbacks: {
            label: context => {
              const label = context.label ?? '';
              const value = Number(context.parsed || 0);
              return `${label}: ${this.formatCurrency(value)}`;
            }
          }
        }
      }
    };
  }

  private toTransactionRow(transaction: TransactionModel): TransactionRow {
    const date = this.toLocalDate(transaction.date);
    const key = String(transaction.id ?? `${transaction.accountId}-${date.toISOString()}-${transaction.description ?? ''}`);
    const category = this.transactionCategory(transaction);
    const accountName = this.accountName(transaction.accountId);
    const categoryName = this.categoryName(transaction, category);
    const macroCategoryName = this.macroCategoryName(transaction, category);

    return {
      key,
      transaction,
      description: transaction.description?.trim() || this.translateService.instant('SUMMARY.TRANSACTIONS.NO_DESCRIPTION'),
      amount: Number(transaction.amount || 0),
      currencyCode: transaction.currencyCode || this.defaultCurrency,
      date,
      accountName,
      categoryName,
      macroCategoryName,
      type: transaction.transactionType
    };
  }

  private accountName(accountId: number): string {
    return this.accounts.find(account => account.id === Number(accountId))?.name
      ?? this.translateService.instant('SUMMARY.TRANSACTIONS.UNKNOWN_ACCOUNT');
  }

  private transactionCategory(transaction: TransactionModel): CategoryModel | null {
    if (transaction.categoryId === null || transaction.categoryId === undefined) {
      return null;
    }

    return this.categories.find(category => category.id === Number(transaction.categoryId)) ?? null;
  }

  private categoryName(transaction: TransactionModel, category = this.transactionCategory(transaction)): string {
    if (this.isTransferTransaction(transaction)) {
      return this.translateService.instant('SUMMARY.TRANSACTIONS.TRANSFER');
    }

    return this.normalizeDisplayLabel(category?.category)
      ?? this.translateService.instant('SUMMARY.TRANSACTIONS.NO_CATEGORY');
  }

  private macroCategoryName(transaction: TransactionModel, category = this.transactionCategory(transaction)): string {
    if (this.isTransferTransaction(transaction)) {
      return '';
    }

    return this.normalizeDisplayLabel(category?.macroCategory) ?? '';
  }

  private normalizeDisplayLabel(value?: string | null): string | null {
    if (!value) return null;

    return value.trim() === 'Caff?' ? 'Caff\u00e8' : value;
  }

  private isTransferTransaction(transaction: TransactionModel): boolean {
    const transferGroupId = transaction.transferGroupId?.trim();
    return Boolean(transaction.transferCounterpartyAccountId)
      || Boolean(transferGroupId);
  }

  private nonTransferTransactions(transactions: TransactionModel[]): TransactionModel[] {
    return transactions.filter(transaction => !this.isTransferTransaction(transaction));
  }

  private convertRecordToDefaultCurrency(record: Record<string, number>): number {
    return Object.entries(record).reduce((sum, [currency, amount]) => {
      return sum + this.toDefaultCurrency(amount, currency);
    }, 0);
  }

  private toDefaultCurrency(amount: number, currency: string): number {
    if (!Number.isFinite(amount)) return 0;
    if (!currency || currency === this.defaultCurrency) return amount;

    const rate = this.rates[currency];
    return rate && rate > 0 ? amount / rate : 0;
  }

  private buildCurrentExportFilter(): TransactionExportFilterInputDTO {
    const range = this.resolveRange();
    const account = this.selectedAccountForExport();
    const category = this.selectedCategoryForExport();
    const selectedMacro = this.macroCategoryFilterControl.value;

    return {
      account: account?.name,
      startDate: range ? this.formatDateInput(range.start) : undefined,
      endDate: range ? this.formatDateInput(range.end) : undefined,
      macroCategory: category?.macroCategory ?? (selectedMacro !== 'all' ? selectedMacro : undefined),
      category: category?.category,
      minAmount: this.parseOptionalAmount(this.minAmountFilterControl.value) ?? undefined,
      maxAmount: this.parseOptionalAmount(this.maxAmountFilterControl.value) ?? undefined
    };
  }

  private hasActiveSummaryFilters(): boolean {
    return this.activeSummaryFilterCount > 0;
  }

  private selectedAccountForExport(): AccountModel | null {
    const selectedAccountId = this.accountFilterControl.value;
    if (selectedAccountId === 'all') return null;

    return this.accounts.find(account => account.id === Number(selectedAccountId)) ?? null;
  }

  private selectedCategoryForExport(): CategoryModel | null {
    const selectedCategoryId = this.categoryFilterControl.value;
    if (selectedCategoryId === 'all') return null;

    return this.categories.find(category => category.id === Number(selectedCategoryId)) ?? null;
  }

  private ensureCategoryFilterMatchesMacro(): void {
    const selectedCategory = this.selectedCategoryForExport();
    const selectedMacro = this.macroCategoryFilterControl.value;

    if (selectedCategory && selectedMacro !== 'all' && selectedCategory.macroCategory !== selectedMacro) {
      this.categoryFilterControl.setValue('all', { emitEvent: false });
    }
  }

  private parseOptionalAmount(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;

    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
  }

  private countDays(range: DateRange): number {
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / dayMs) + 1);
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate()
      && a.getMonth() === b.getMonth()
      && a.getFullYear() === b.getFullYear();
  }

  private clampToToday(date: Date): Date {
    const today = this.stripTime(new Date());
    const strippedDate = this.stripTime(date);
    return strippedDate > today ? today : strippedDate;
  }

  private parseInputDate(value: string): Date | null {
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(part => !Number.isFinite(part))) {
      return null;
    }

    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  private toLocalDate(value: Date | string): Date {
    if (value instanceof Date) {
      return this.stripTime(value);
    }

    const datePart = String(value).slice(0, 10);
    const parsed = this.parseInputDate(datePart);
    return parsed ?? this.stripTime(new Date(value));
  }

  private formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private upcomingRecurringUntilDate(): string {
    const until = new Date();
    until.setMonth(until.getMonth() + 2);
    return this.formatDateInput(until);
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', {
      style: 'currency',
      currency: this.defaultCurrency,
      maximumFractionDigits: 2
    });
  }

  private roundAmount(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private chartPalette(): string[] {
    return [
      this.cssVar('--summary-chart-1'),
      this.cssVar('--summary-chart-2'),
      this.cssVar('--summary-chart-3'),
      this.cssVar('--summary-chart-4'),
      this.cssVar('--summary-chart-5'),
      this.cssVar('--summary-chart-6')
    ];
  }

  private cssVar(name: string): string {
    return getComputedStyle(this.host.nativeElement).getPropertyValue(name).trim();
  }
}
