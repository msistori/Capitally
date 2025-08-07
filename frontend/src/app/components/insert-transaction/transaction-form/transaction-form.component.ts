import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TransactionModel } from '../../../models/transaction.model';
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
  matrix: (Date | null)[][] = [];

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
      recurringCount: [null],
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
    this.buildMonthMatrix(this.form.get('date')!.value);
    this.form.get('date')!.valueChanges.subscribe(d => {
      this.buildMonthMatrix(d);
    });
  }

  private buildMonthMatrix(d: Date) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const first = new Date(y, m, 1);
    const startOff = (first.getDay() + 6) % 7;
    const daysCount = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOff; i++) cells.push(null);
    for (let day = 1; day <= daysCount; day++) cells.push(new Date(y, m, day));
    while (cells.length % 7) cells.push(null);
    this.matrix = [];
    for (let i = 0; i < cells.length; i += 7) {
      this.matrix.push(cells.slice(i, i + 7));
    }
  }

  get currentWeek(): (Date | null)[] {
    const sel: Date = this.form.get('date')!.value;
    return this.matrix.find(w => w.some(d => d && this.sameDay(d, sel))) || this.matrix[0];
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

  selectDay(d: Date | null) {
    if (!d) return;
    this.form.get('date')!.setValue(d);
  }

  isToday(d: Date | null): boolean {
    if (!d) return false;
    const now = new Date();
    return this.sameDay(d, now);
  }

  isSelected(d: Date | null): boolean {
    if (!d) return false;
    return this.sameDay(d, this.form.get('date')!.value);
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