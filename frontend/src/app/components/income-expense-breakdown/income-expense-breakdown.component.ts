import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, signal } from '@angular/core';
import { IncomeExpenseBreakdownResponseDTO } from 'src/app/models/dashboard.model';
import { TransactionTypeEnum } from 'src/app/models/transaction.model';
import { TranslateService } from '@ngx-translate/core';

interface CategoryVM {
  macroCategory: string;
  total: number;
  percent: number;
}

interface SectionVM {
  total: number;
  categories: CategoryVM[];
}

interface ViewModel {
  INCOME: SectionVM | null;
  EXPENSE: SectionVM | null;
}

@Component({
  selector: 'app-income-expense-breakdown',
  templateUrl: './income-expense-breakdown.component.html',
  styleUrls: ['./income-expense-breakdown.component.scss']
})
export class IncomeExpenseBreakdownComponent implements OnInit, OnChanges {
  @Input() items: IncomeExpenseBreakdownResponseDTO[] = [];

  @Output() monthChange = new EventEmitter<{ startDate: string; endDate: string }>();

  vm = signal<ViewModel>({ INCOME: null, EXPENSE: null });

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  defaultCurrency = 'EUR';

  private readonly today = new Date();

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.emitMonthDates();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.vm.set(this.buildView(this.items));
  }

  prevMonth(): void {
    const d = new Date(this.currentYear, this.currentMonth, 1);
    d.setMonth(d.getMonth() - 1);
    this.currentYear = d.getFullYear();
    this.currentMonth = d.getMonth();
    this.emitMonthDates();
  }

  nextMonth(): void {
    if (this.isNextDisabled()) return;
    const d = new Date(this.currentYear, this.currentMonth, 1);
    d.setMonth(d.getMonth() + 1);
    this.currentYear = d.getFullYear();
    this.currentMonth = d.getMonth();
    this.emitMonthDates();
  }

  isNextDisabled(): boolean {
    const y = this.today.getFullYear();
    const m = this.today.getMonth();
    return this.currentYear > y || (this.currentYear === y && this.currentMonth >= m);
  }

  monthLabel(): string {
    const d = new Date(this.currentYear, this.currentMonth, 1);
    const locale = ({ it: 'it-IT', en: 'en-US' } as Record<string, string>)[this.translateService.currentLang] || 'en-US';
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }

  private emitMonthDates(): void {
    const start = new Date(this.currentYear, this.currentMonth, 1);
    const end = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    this.monthChange.emit({ startDate, endDate });
  }

  private buildView(items: IncomeExpenseBreakdownResponseDTO[]): ViewModel {
    const filtered = items.filter(i => i.currency === this.defaultCurrency);

    const buildSection = (type: TransactionTypeEnum): SectionVM | null => {
      const cats = filtered.filter(i => i.transactionType === type);
      if (cats.length === 0) return null;

      const total = cats.reduce((sum, c) => sum + Number(c.total || 0), 0);
      const categories: CategoryVM[] = cats
        .map(c => ({
          macroCategory: c.macroCategory,
          total: Number(c.total || 0),
          percent: total > 0 ? (Number(c.total || 0) / total) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);

      return { total, categories };
    };

    return {
      INCOME: buildSection(TransactionTypeEnum.INCOME),
      EXPENSE: buildSection(TransactionTypeEnum.EXPENSE)
    };
  }
}
