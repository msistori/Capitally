import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RecurrencePeriodEnum, TransactionModel, TransactionTypeEnum } from '../../../models/transaction.model';
import { CategorySelectionDialogComponent } from '../category-selection-dialog/category-selection-dialog.component';
import { CurrencyService } from '../../../services/currency.service';
import { TransactionService } from '../../../services/transaction.service';
import { Utils } from '../../utils';
import { CategoryModel } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
import { AccountService } from '../../../services/account.service';
import { AccountModel } from '../../../models/account.model';
import { RefreshService } from '../../../services/refresh.service';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../../../auth/storage.service';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss']
})
export class TransactionFormComponent implements OnInit {
  @Output() submitted = new EventEmitter<TransactionModel>();
  form!: FormGroup;
  currencies: { code: string }[] = [];
  categories: CategoryModel[] = [];
  recentCategories: CategoryModel[] = [];
  accounts: AccountModel[] = [];
  plus!: { name: string; icon: string };
  selectedCategory: string | null = null;
  private storage = inject(StorageService);
  readonly userId = Number(this.storage.getUserId() || 1);
  weekDays: string[] = [];
  matrixDate: (Date | null)[][] = [];
  matrixRecurringEndDate: (Date | null)[][] = [];
  recurrencePeriods = Object.values(RecurrencePeriodEnum);
  viewDate: Date = new Date();

  RecurrencePeriodEnum = RecurrencePeriodEnum;

  constructor(
    private dialogRef: MatDialogRef<TransactionFormComponent>,
    private fb: FormBuilder,
    private dialog: MatDialog,
    protected utils: Utils,
    private currencyService: CurrencyService,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private accountService: AccountService,
    private refreshService: RefreshService,
    public translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      accountId: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      currencyCode: [this.storage.getDefaultCurrency(), Validators.required],
      transactionType: [TransactionTypeEnum.EXPENSE, Validators.required],
      categoryId: [null],
      date: [new Date()],
      description: [''],
      isRecurring: [false],
      recurringPeriod: [null],
      recurringEndDate: [null]
    });
    this.currencyService.getCurrencies().subscribe(data => this.currencies = data);
    this.categoryService.getCategories(this.userId.toString())
      .subscribe(data => {
        this.categories = data;
        this.recentCategories = this.categories.slice(0, 3);
      });
    this.accountService.getAccounts(this.userId.toString())
      .subscribe(data => this.accounts = data);
    const base = './../../../../assets/icons';
    this.plus = { name: 'CATEGORY.OTHER', icon: `${base}/plus.svg` };
    this.translateService.get('FORM.WEEK_DAYS').subscribe((days: string[]) => {
      this.weekDays = days;
    });
    this.buildMonthMatrixDate(this.form.get('date')!.value);
    this.form.get('date')!.valueChanges.subscribe(d => {
      this.buildMonthMatrixDate(d);
    });
    this.viewDate = this.form.get('recurringEndDate')!.value ?? new Date();
    this.buildMonthMatrixRecurringEndDate(this.viewDate);
  }

  private buildMonthMatrixDate(d: Date) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const first = new Date(y, m, 1);
    const startOff = (first.getDay() + 6) % 7;
    const daysCount = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOff; i++) cells.push(null);
    for (let day = 1; day <= daysCount; day++) cells.push(new Date(y, m, day));
    while (cells.length % 7) cells.push(null);
    this.matrixDate = [];
    for (let i = 0; i < cells.length; i += 7) {
      this.matrixDate.push(cells.slice(i, i + 7));
    }
  }

  get currentWeekDate(): (Date | null)[] {
    const sel: Date = this.form.get('date')!.value;
    return this.matrixDate.find(w => w.some(d => d && this.sameDay(d, sel))) || this.matrixDate[0];
  }

  private buildMonthMatrixRecurringEndDate(d: Date) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const first = new Date(y, m, 1);
    const startOff = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const totalCells = Math.ceil((startOff + daysInMonth) / 7) * 7;

    const gridStart = new Date(y, m, 1 - startOff);
    const cells: Date[] = [];
    for (let i = 0; i < totalCells; i++) {
      cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
    }

    this.matrixRecurringEndDate = [];
    for (let i = 0; i < cells.length; i += 7) {
      this.matrixRecurringEndDate.push(cells.slice(i, i + 7));
    }
  }

  prevWeek() {
    const d: Date = this.form.get('date')!.value;
    const prev = new Date(d);
    prev.setDate(d.getDate() - 7);
    this.form.get('date')!.setValue(prev);
  }

  nextWeek() {
    const d: Date = this.form.get('date')!.value;
    const nxt = new Date(d);
    nxt.setDate(d.getDate() + 7);
    this.form.get('date')!.setValue(nxt);
  }

  prevMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.buildMonthMatrixRecurringEndDate(this.viewDate);
  }

  nextMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.buildMonthMatrixRecurringEndDate(this.viewDate);
  }

  isOutside(d: Date | null): boolean {
    if (!d) return false;
    return d.getMonth() !== this.viewDate.getMonth() || d.getFullYear() !== this.viewDate.getFullYear();
  }

  selectDay(d: Date | null, field: string) {
    if (!d) return;
    if (field === 'recurringEndDate' && this.isOutside(d)) return;
    this.form.get(field)!.setValue(d);
  }

  isToday(d: Date | null): boolean {
    if (!d) return false;
    const now = new Date();
    return this.sameDay(d, now);
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
    this.form.get('recurringEndDate')?.setValue(event.checked ? new Date() : null)
  }

  selectCategory(cat: any): void {
    this.form.get('categoryId')!.setValue(cat.id);
    this.selectedCategory = cat.category;
  }

  openAllCategories(): void {
    this.selectedCategory = this.plus.name;
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
      this.recentCategories = this.categories.slice(0, 3);
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const payload: TransactionModel = this.form.value;
    payload.userId = this.userId;
    if (!payload.isRecurring) payload.recurrenceEndDate = undefined;
    this.transactionService.postTransaction(payload)
      .subscribe(
        () => {
          this.refreshService.triggerRefresh();
          this.dialogRef.close();
        },
        err => console.error('Save error', err)
      );
  }
}
