import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, effect, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IncomeExpenseBreakdownResponseDTO } from 'src/app/models/dashboard.model';
import { TransactionTypeEnum } from 'src/app/models/transaction.model';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../../auth/storage.service';
import { FxRateService } from '../../services/fx-rate.service';

interface CategoryVM {
  macroCategory: string;
  currency: string;
  total: number;
  convertedTotal: number;
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

  private storage = inject(StorageService);
  private fx = inject(FxRateService);
  private readonly ratesSig = signal<Record<string, number>>({});
  private readonly defaultCurrencySig = toSignal(this.storage.defaultCurrency$, {
    initialValue: this.storage.getDefaultCurrency()
  });

  defaultCurrency = this.storage.getDefaultCurrency();

  private readonly today = new Date();

  constructor(private translateService: TranslateService) {
    effect((onCleanup) => {
      const currency = this.defaultCurrencySig();
      this.defaultCurrency = currency;

      const sub = this.fx.getRates(currency).subscribe({
        next: rates => {
          this.ratesSig.set(rates || {});
          this.vm.set(this.buildView(this.items));
        },
        error: () => {
          this.ratesSig.set({});
          this.vm.set(this.buildView(this.items));
        }
      });

      onCleanup(() => sub.unsubscribe());
    }, { allowSignalWrites: true });
  }

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
    const startDate = this.formatLocalDate(start);
    const endDate = this.formatLocalDate(end);
    this.monthChange.emit({ startDate, endDate });
  }

  private formatLocalDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildView(items: IncomeExpenseBreakdownResponseDTO[]): ViewModel {
    const buildSection = (type: TransactionTypeEnum): SectionVM | null => {
      const cats = items.filter(i => i.transactionType === type);
      if (cats.length === 0) return null;

      const total = cats.reduce((sum, c) => {
        return sum + this.toDefaultCurrency(Number(c.total || 0), c.currency || this.defaultCurrency);
      }, 0);

      const categories: CategoryVM[] = cats
        .map(c => {
          const rowCurrency = c.currency || this.defaultCurrency;
          const rowTotal = Number(c.total || 0);
          const convertedTotal = this.toDefaultCurrency(rowTotal, rowCurrency);

          return {
            macroCategory: c.macroCategory,
            currency: rowCurrency,
            total: rowTotal,
            convertedTotal,
            percent: total > 0 ? (convertedTotal / total) * 100 : 0
          };
        })
        .sort((a, b) => b.convertedTotal - a.convertedTotal);

      return { total, categories };
    };

    return {
      INCOME: buildSection(TransactionTypeEnum.INCOME),
      EXPENSE: buildSection(TransactionTypeEnum.EXPENSE)
    };
  }

  private toDefaultCurrency(amount: number, currency: string): number {
    if (currency === this.defaultCurrency) return amount;

    const rate = this.ratesSig()[currency];
    return rate && rate > 0 ? amount / rate : 0;
  }
}
