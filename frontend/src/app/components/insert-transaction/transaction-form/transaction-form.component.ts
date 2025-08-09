import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RecurrencePeriodEnum, TransactionModel } from '../../../models/transaction.model';
import { CategorySelectionDialogComponent } from '../category-selection-dialog/category-selection-dialog.component';
import { CurrencyService } from '../../../services/currency.service';
import { TransactionService } from '../../../services/transaction.service';
import { Utils } from '../../utils';
import { CategoryModel } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
import { AccountService } from '../../../services/account.service';
import { AccountModel } from '../../../models/account.model';
import { RefreshService } from '../../../services/refresh.service';

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
  readonly userId = 1;
  weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  matrixDate: (Date | null)[][] = [];
  matrixRecurringEndDate: (Date | null)[][] = [];
  recurrencePeriods = Object.values(RecurrencePeriodEnum);

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
    private refreshService: RefreshService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      accountId: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      currencyCode: ['EUR', Validators.required],
      transactionType: ['EXPENSE', Validators.required],
      categoryId: [null],
      date: [new Date()],
      description: [''],
      isRecurring: [false],
      recurringPeriod: [null],
      recurringEndDate: [new Date()]
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
    this.buildMonthMatrixDate(this.form.get('date')!.value);
    this.form.get('date')!.valueChanges.subscribe(d => {
      this.buildMonthMatrixDate(d);
    });
    this.buildMonthMatrixRecurringEndDate(this.form.get('recurringEndDate')!.value);
    this.form.get('recurringEndDate')!.valueChanges.subscribe(d => {
      this.buildMonthMatrixRecurringEndDate(d);
    });
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
    const daysCount = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOff; i++) cells.push(null);
    for (let day = 1; day <= daysCount; day++) cells.push(new Date(y, m, day));
    while (cells.length % 7) cells.push(null);
    this.matrixRecurringEndDate = [];
    for (let i = 0; i < cells.length; i += 7) {
      this.matrixRecurringEndDate.push(cells.slice(i, i + 7));
    }
  }

  get currentWeekRecurringEndDate(): (Date | null)[] {
    const sel: Date = this.form.get('recurringEndDate')!.value;
    return this.matrixRecurringEndDate.find(w => w.some(d => d && this.sameDay(d, sel))) || this.matrixRecurringEndDate[0];
  }

  prevWeek(field: string) {
      const d: Date = this.form.get(field)!.value;
      const prev = new Date(d);
      prev.setDate(d.getDate() - 7);
      this.form.get(field)!.setValue(prev);
  }

  nextWeek(field: string) {
    const d: Date = this.form.get(field)!.value;
    const nxt = new Date(d);
    nxt.setDate(d.getDate() + 7);
    this.form.get(field)!.setValue(nxt);
  }

  selectDay(d: Date | null, field: string) {
    if (!d) return;
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

  selectCategory(cat: any): void {
    this.form.get('categoryId')!.setValue(cat.id);
    this.selectedCategory = cat.category;
  }

  openAllCategories(): void {
    this.selectedCategory = this.plus.name;
    const ref = this.dialog.open(CategorySelectionDialogComponent, {
      width: '100%',
      maxWidth: '400px',
      data: { selectedCategory: this.form.get('categoryId')!.value },
      panelClass: 'view-all-categories-modal-panel'
    });
    ref.afterClosed().subscribe(res => {
      if (res) this.form.get('categoryId')!.setValue(res);
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