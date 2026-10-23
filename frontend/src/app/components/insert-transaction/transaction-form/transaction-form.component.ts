import { Component, OnChanges, OnInit, Output, EventEmitter, Input, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { RecurrencePeriodEnum, TransactionModel, TransactionTypeEnum } from '../../../models/transaction.model';
import { CategorySelectionDialogComponent } from '../category-selection-dialog/category-selection-dialog.component';
import { CurrencyService } from '../../../services/currency.service';
import { TransactionService } from '../../../services/transaction.service';
import { Utils } from '../../utils';
import { CategoryModel } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
import { AccountService } from '../../../services/account.service';
import { AccountModel } from '../../../models/account.model';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../../../auth/storage.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { GuestService } from '../../../services/guest.service';
import { forkJoin } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss']
})
export class TransactionFormComponent implements OnInit, OnChanges {
  @Input() transaction: TransactionModel | null = null;
  @Output() submitted = new EventEmitter<TransactionModel>();
  form!: FormGroup;
  currencies: { code: string; name?: string }[] = [];
  filteredCurrencies: { code: string; name?: string }[] = [];
  currencySearchControl = new FormControl('');
  categories: CategoryModel[] = [];
  recentCategories: CategoryModel[] = [];
  descriptionSuggestions: string[] = [];
  filteredDescriptionSuggestions: string[] = [];
  accounts: AccountModel[] = [];
  plus!: { name: string; icon: string };
  selectedCategory: string | null = null;
  private storage = inject(StorageService);
  private guestService = inject(GuestService);
  readonly userId = Number(this.storage.getUserId() || 1);
  readonly today = new Date();
  readonly yesterday = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 1);
  lastTransactionDate: Date | null = null;
  calendarOpen = false;
  readonly calendarMonths = Array.from({ length: 12 }, (_, month) => new Date(2024, month, 1));
  calendarViews: Record<string, Date> = { date: new Date(), recurringEndDate: new Date() };
  calendarDays: Record<string, Date[]> = { date: [], recurringEndDate: [] };
  yearPageStart = 2016;

  get calendarYears(): number[] {
    return Array.from({ length: 24 }, (_, index) => this.yearPageStart + index);
  }

  get calendarLocale(): string {
    return this.translateService.currentLang === 'it' ? 'it-IT' : 'en-US';
  }
  recurrencePeriods = Object.values(RecurrencePeriodEnum);

  RecurrencePeriodEnum = RecurrencePeriodEnum;

  get isEditMode(): boolean {
    return !!this.transaction?.id;
  }

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    protected utils: Utils,
    private currencyService: CurrencyService,
    private transactionService: TransactionService,
    private refreshService: RefreshService,
    private categoryService: CategoryService,
    private accountService: AccountService,
    public translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      accountId: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      currencyCode: [this.storage.getDefaultCurrency(), Validators.required],
      transactionType: [TransactionTypeEnum.EXPENSE, Validators.required],
      categoryId: [null],
      date: [new Date(), Validators.required],
      description: [''],
      isRecurring: [false],
      recurringPeriod: [null],
      recurringEndDate: [null]
    });

    this.applyTransactionToForm();

    this.currencyService.getCurrencies().subscribe(data => {
      this.currencies = data;
      this.filteredCurrencies = data;
    });

    this.currencySearchControl.valueChanges.subscribe(searchTerm => {
      this.filterCurrencies(searchTerm || '');
    });

    this.form.get('description')!.valueChanges.pipe(
      startWith(this.form.get('description')!.value || ''),
      map(value => this.getFilteredDescriptionSuggestions(value || ''))
    ).subscribe(suggestions => this.filteredDescriptionSuggestions = suggestions);

    forkJoin({
      categories: this.categoryService.getCategories(),
      transactions: this.transactionService.getTransactions(),
      accounts: this.accountService.getAccounts()
    }).subscribe({
      next: ({ categories, transactions, accounts }) => {
        this.categories = categories;
        this.accounts = this.getAccountsByRecentTransactions(accounts, transactions);
        if (!this.transaction && !this.form.get('accountId')!.value) {
          this.form.patchValue({ accountId: this.accounts[0]?.id ?? null });
        }
        const lastTransaction = this.getTransactionsByInsertionDate(transactions)[0];
        this.lastTransactionDate = lastTransaction ? this.toFormDate(lastTransaction.date) : null;
        this.descriptionSuggestions = this.getUniqueDescriptions(transactions);
        this.filteredDescriptionSuggestions = this.getFilteredDescriptionSuggestions(
          this.form.get('description')!.value || ''
        );
        this.updateRecentCategories(transactions);
        this.applySelectedCategoryLabel();
      },
      error: err => console.error('Transaction form data error', err)
    });

    const base = './../../../../assets/icons';
    this.plus = { name: 'CATEGORY.OTHER', icon: `${base}/plus.svg` };

    this.updateCalendar('date', this.form.get('date')!.value);
    this.updateCalendar('recurringEndDate', this.form.get('recurringEndDate')!.value ?? this.today);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('transaction' in changes && this.form) {
      this.applyTransactionToForm();
    }
  }

  filterCurrencies(searchTerm: string): void {
    const term = searchTerm.toLowerCase().trim();
    const currentCurrency = this.form.get('currencyCode')!.value;

    if (!term) {
      this.filteredCurrencies = this.currencies;
      return;
    }

    const filtered = this.currencies.filter(cur =>
      cur.code.toLowerCase().includes(term) ||
      (cur.name && cur.name.toLowerCase().includes(term))
    );

    const currentCur = this.currencies.find(c => c.code === currentCurrency);
    const isCurrentInFiltered = filtered.find(c => c.code === currentCurrency);

    if (currentCur && !isCurrentInFiltered) {
      this.filteredCurrencies = [currentCur, ...filtered];
    } else {
      this.filteredCurrencies = filtered;
    }
  }

  shouldHideCurrent(cur: any, index: number): boolean {
    const currentCurrency = this.form.get('currencyCode')!.value;
    const searchTerm = this.currencySearchControl.value;

    if (index !== 0 || !searchTerm || cur.code !== currentCurrency) {
      return false;
    }

    const matchesSearch = cur.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cur.name && cur.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return !matchesSearch;
  }

  onCurrencyPanelOpenChange(opened: boolean): void {
    if (!opened) {
      this.currencySearchControl.setValue('');
      this.filteredCurrencies = this.currencies;
    }
  }

  private getUniqueDescriptions(transactions: TransactionModel[]): string[] {
    const unique = new Map<string, string>();

    for (const transaction of transactions) {
      const description = (transaction.description || '').trim();
      if (!description) continue;

      const key = description.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, description);
      }
    }

    return Array.from(unique.values());
  }

  private getFilteredDescriptionSuggestions(value: string): string[] {
    const term = value.toLowerCase().trim();
    if (!term) return [];

    return this.descriptionSuggestions
      .filter(description => {
        const normalizedDescription = description.toLowerCase();
        return normalizedDescription.includes(term) && normalizedDescription !== term;
      })
      .slice(0, 8);
  }

  private updateRecentCategories(transactions: TransactionModel[]): void {
    const categoriesById = new Map(
      this.categories
        .filter(category => category.id !== undefined)
        .map(category => [Number(category.id), category])
    );
    const seenCategoryIds = new Set<number>();
    const recentCategories: CategoryModel[] = [];

    for (const transaction of this.getTransactionsByInsertionDate(transactions)) {
      if (transaction.categoryId === null || transaction.categoryId === undefined) continue;

      const categoryId = Number(transaction.categoryId);
      const category = categoriesById.get(categoryId);
      if (!category || seenCategoryIds.has(categoryId)) continue;

      seenCategoryIds.add(categoryId);
      recentCategories.push(category);

      if (recentCategories.length === 6) break;
    }

    this.recentCategories = recentCategories.length ? recentCategories : this.categories.slice(0, 6);
  }

  private getTransactionsByInsertionDate(transactions: TransactionModel[]): TransactionModel[] {
    return [...transactions].sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
  }

  private getAccountsByRecentTransactions(accounts: AccountModel[], transactions: TransactionModel[]): AccountModel[] {
    const accountsById = new Map(accounts.map(account => [Number(account.id), account]));
    const seenAccountIds = new Set<number>();
    const recentAccounts: AccountModel[] = [];

    for (const transaction of this.getTransactionsByInsertionDate(transactions)) {
      const accountId = Number(transaction.accountId);
      const account = accountsById.get(accountId);
      if (!account || seenAccountIds.has(accountId)) continue;

      seenAccountIds.add(accountId);
      recentAccounts.push(account);

      if (recentAccounts.length === 3) break;
    }

    const remainingAccounts = accounts
      .filter(account => !seenAccountIds.has(Number(account.id)))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...recentAccounts, ...remainingAccounts];
  }

  get showLastTransactionDate(): boolean {
    return !!this.lastTransactionDate
      && !this.sameDay(this.lastTransactionDate, this.today)
      && !this.sameDay(this.lastTransactionDate, this.yesterday);
  }

  selectDay(date: Date | null, field: string): void {
    if (!date) return;
    this.form.get(field)!.setValue(date);
    this.updateCalendar(field, date);
    if (field === 'date') this.calendarOpen = false;
  }

  toggleCalendar(): void {
    this.calendarOpen = !this.calendarOpen;
    if (this.calendarOpen) this.updateCalendar('date', this.form.get('date')!.value);
  }

  private updateCalendar(field: string, date: Date): void {
    this.calendarViews[field] = new Date(date);
    const start = field === 'date'
      ? new Date(date)
      : new Date(date.getFullYear(), date.getMonth(), 1);
    const offset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offset);
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const count = field === 'date' ? 7 : Math.ceil((offset + daysInMonth) / 7) * 7;
    this.calendarDays[field] = Array.from({ length: count }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }

  moveCalendar(field: string, direction: number): void {
    const date = new Date(this.calendarViews[field]);
    if (field === 'date') {
      date.setDate(date.getDate() + direction * 7);
    } else {
      date.setDate(1);
      date.setMonth(date.getMonth() + direction);
    }
    this.updateCalendar(field, date);
  }

  chooseCalendarMonth(field: string, month: number): void {
    const view = this.calendarViews[field];
    this.changeCalendarPeriod(field, view.getFullYear(), month);
  }

  chooseCalendarYear(field: string, year: number): void {
    this.changeCalendarPeriod(field, year, this.calendarViews[field].getMonth());
  }

  private changeCalendarPeriod(field: string, year: number, month: number): void {
    const date = new Date(this.calendarViews[field]);
    const day = date.getDate();
    date.setDate(1);
    date.setFullYear(year, month);
    const endOfMonth = new Date(date);
    endOfMonth.setMonth(month + 1, 0);
    date.setDate(Math.min(day, endOfMonth.getDate()));
    this.updateCalendar(field, date);
  }

  openYearSelection(field: string): void {
    this.yearPageStart = Math.max(1, Math.min(9976, Math.floor(this.calendarViews[field].getFullYear() / 24) * 24));
  }

  moveYearPage(direction: number, event: Event): void {
    event.stopPropagation();
    this.yearPageStart = Math.max(1, Math.min(9976, this.yearPageStart + direction * 24));
  }

  isOutsideMonth(date: Date, field: string): boolean {
    const view = this.calendarViews[field];
    return date.getMonth() !== view.getMonth() || date.getFullYear() !== view.getFullYear();
  }

  isSelected(d: Date | null, field: string): boolean {
    if (!d) return false;
    return this.sameDay(d, this.form.get(field)!.value);
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate()
      && a.getMonth() === b.getMonth()
      && a.getFullYear() === b.getFullYear();
  }

  recurringEndDateSelected(event: any) {
    const date = event.checked ? new Date() : null;
    this.form.get('recurringEndDate')?.setValue(date);
    if (date) this.updateCalendar('recurringEndDate', date);
  }

  selectCategory(cat: any): void {
    this.form.get('categoryId')!.setValue(cat.id);
    this.selectedCategory = cat.category;
  }

  openAllCategories(): void {
    const ref = this.dialog.open(CategorySelectionDialogComponent, {
      panelClass: 'view-all-categories-modal-panel',
      data: {
        selectedCategoryId: this.form.get('categoryId')!.value as number | null,
        categories: this.categories,
        userId: this.userId
      }
    });

    ref.afterClosed().subscribe((picked: CategoryModel | null) => {
      if (!picked) return;

      this.form.patchValue({ categoryId: picked.id });
      this.selectedCategory = picked.category;

      this.categories = [picked, ...this.categories.filter(c => c.id !== picked.id)];
      this.recentCategories = [picked, ...this.recentCategories.filter(c => c.id !== picked.id)].slice(0, 6);
    });
  }

  submit(): void {
    if (this.guestService.isGuestUser()) {
      this.guestService.showGuestRestriction();
      return;
    }
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const payload: TransactionModel = {
      ...(this.transaction ?? {}),
      userId: this.userId,
      accountId: Number(value.accountId),
      amount: Number(value.amount),
      currencyCode: value.currencyCode,
      date: this.formatDateInput(value.date),
      description: value.description,
      categoryId: value.categoryId,
      transactionType: value.transactionType,
      isRecurring: value.isRecurring,
      recurrencePeriod: value.isRecurring ? value.recurringPeriod : undefined,
      recurrenceEndDate: value.isRecurring && value.recurringEndDate
        ? this.formatDateInput(value.recurringEndDate)
        : undefined
    };

    const request = this.transaction?.id
      ? this.transactionService.putTransaction(this.transaction.id, payload)
      : this.transactionService.postTransaction(payload);

    request.subscribe(
      tx => this.submitted.emit(tx),
      err => console.error('Save error', err)
    );
  }

  private applyTransactionToForm(): void {
    if (!this.form || !this.transaction) return;

    const date = this.toFormDate(this.transaction.date);
    const recurringEndDate = this.transaction.recurrenceEndDate
      ? this.toFormDate(this.transaction.recurrenceEndDate)
      : null;

    this.form.patchValue({
      accountId: this.transaction.accountId,
      amount: Number(this.transaction.amount || 0),
      currencyCode: this.transaction.currencyCode || this.storage.getDefaultCurrency(),
      transactionType: this.transaction.transactionType,
      categoryId: this.transaction.categoryId ?? null,
      date,
      description: this.transaction.description || '',
      isRecurring: !!this.transaction.isRecurring,
      recurringPeriod: this.transaction.recurrencePeriod ?? null,
      recurringEndDate
    }, { emitEvent: false });

    this.updateCalendar('date', date);
    this.updateCalendar('recurringEndDate', recurringEndDate ?? this.today);
    this.applySelectedCategoryLabel();
  }

  private applySelectedCategoryLabel(): void {
    const categoryId = this.form?.get('categoryId')?.value;
    if (!categoryId) {
      this.selectedCategory = null;
      return;
    }

    this.selectedCategory = this.categories.find(category => category.id === Number(categoryId))?.category ?? null;
  }

  private toFormDate(value: Date | string): Date {
    if (value instanceof Date) return value;

    const parts = String(value).slice(0, 10).split('-').map(Number);
    if (parts.length === 3 && parts.every(part => Number.isFinite(part))) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    return new Date(value);
  }

  private formatDateInput(value: Date | string): string {
    const date = value instanceof Date ? value : this.toFormDate(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  removeTransaction(): void {
    this.transactionService.deleteTransaction(this.transaction?.id).subscribe({
          next: () => {this.refreshService.triggerRefresh(), this.submitted.emit()},
          error: err => console.error(err)
        });
  }
}
