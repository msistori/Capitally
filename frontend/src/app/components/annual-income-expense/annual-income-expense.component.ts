import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Subscription } from 'rxjs';
import { StorageService } from '../../auth/storage.service';
import { AnnualIncomeExpenseResponseDTO } from '../../models/dashboard.model';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

type BarDataset = ChartConfiguration<'bar'>['data']['datasets'][number];

@Component({
  selector: 'app-annual-income-expense',
  templateUrl: './annual-income-expense.component.html',
  styleUrls: ['./annual-income-expense.component.scss']
})
export class AnnualIncomeExpenseComponent implements OnInit, OnChanges, OnDestroy {
  @Input() items: AnnualIncomeExpenseResponseDTO[] = [];
  @Input() year = new Date().getFullYear();

  @Output() yearChange = new EventEmitter<number>();

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective<'bar'>;

  labels: string[] = [];
  datasets: BarDataset[] = [];
  defaultCurrency = this.storage.getDefaultCurrency();
  noData = true;
  totalIncome = 0;
  totalExpense = 0;
  incomeLabel = 'Incomes';
  expenseLabel = 'Expenses';
  readonly maxYear = new Date().getFullYear();

  private monthNames: string[] = [];
  private langSub?: Subscription;
  private currencySub?: Subscription;
  private rawDatasetValues: number[][] = [];

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          pointStyle: 'roundedRect',
          padding: 16,
          color: '#005f73'
        }
      },
      tooltip: {
        callbacks: {
          label: context => {
            const value =
              this.rawDatasetValues[context.datasetIndex]?.[context.dataIndex] ??
              Number(context.parsed.y ?? 0);

            const percentageValue = Number(context.parsed.y ?? 0);

            const label =
              context.datasetIndex === 0
                ? this.incomeLabel
                : this.expenseLabel;

            return `${label}: ${this.formatCurrency(value)} (${this.formatPercentage(percentageValue)})`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#005f73', maxRotation: 0 },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        min: 0,
        max: 100,
        ticks: {
          color: '#005f73',
          callback: value => this.formatPercentage(Number(value))
        },
        grid: { color: '#005f7333' }
      }
    }
  };

  constructor(
    private translateService: TranslateService,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    this.monthNames = this.readMonthNames();
    this.setTranslatedLabels();
    this.buildChart();

    this.langSub = this.translateService.onLangChange.subscribe((_: LangChangeEvent) => {
      this.monthNames = this.readMonthNames();
      this.setTranslatedLabels();
      this.buildChart();
    });

    this.currencySub = this.storage.defaultCurrency$.subscribe(currency => {
      this.defaultCurrency = currency;
      this.buildChart();
    });
  }

  private setTranslatedLabels(): void {
    this.incomeLabel = this.translateService.instant('ANNUAL_INCOME_EXPENSE.INCOMES');
    this.expenseLabel = this.translateService.instant('ANNUAL_INCOME_EXPENSE.EXPENSES');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('items' in changes || 'year' in changes) this.buildChart();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.currencySub?.unsubscribe();
  }

  previousYear(): void {
    this.yearChange.emit(this.year - 1);
  }

  nextYear(): void {
    if (this.isNextYearDisabled()) return;
    this.yearChange.emit(this.year + 1);
  }

  isNextYearDisabled(): boolean {
    return this.year >= this.maxYear;
  }

  private buildChart(): void {
    const monthsCount = this.visibleMonthsCount();
    this.labels = this.monthNames.length ? this.monthNames.slice(0, monthsCount) : this.defaultMonthLabels();

    const totals = new Map<number, { income: number; expense: number }>();
    for (const item of this.items || []) {
      if (item.currency !== this.defaultCurrency) continue;

      const monthIndex = Number(item.month.slice(5, 7)) - 1;
      if (monthIndex < 0 || monthIndex >= monthsCount) continue;

      const current = totals.get(monthIndex) ?? { income: 0, expense: 0 };
      current.income += Number(item.income ?? 0);
      current.expense += Number(item.expense ?? 0);
      totals.set(monthIndex, current);
    }

    const incomeData = Array.from({ length: monthsCount }, (_, index) => totals.get(index)?.income ?? 0);
    const expenseData = Array.from({ length: monthsCount }, (_, index) => totals.get(index)?.expense ?? 0);
    this.totalIncome = incomeData.reduce((sum, value) => sum + value, 0);
    this.totalExpense = expenseData.reduce((sum, value) => sum + value, 0);
    const incomePercentages = incomeData.map(value => this.toPercentage(value, this.totalIncome));
    const expensePercentages = expenseData.map(value => this.toPercentage(value, this.totalExpense));
    this.updatePercentageAxisMax([...incomePercentages, ...expensePercentages]);

    this.noData = [...incomeData, ...expenseData].every(value => value === 0);
    this.rawDatasetValues = [incomeData, expenseData];

    this.datasets = [
    {
      label: `${this.incomeLabel}: ${this.formatCurrency(this.totalIncome)}`,
      data: incomePercentages,
      backgroundColor: '#0f8f4e',
    },
    {
      label: `${this.expenseLabel}: ${this.formatCurrency(this.totalExpense)}`,
      data: expensePercentages,
      backgroundColor: '#d51f2a',
    }
  ];

    this.chart?.update();
  }

  private readMonthNames(): string[] {
    const months = this.translateService.instant('YEARLY_BALANCE_TREND.MONTH_NAMES') as string[] | string;
    return Array.isArray(months) ? months : this.defaultMonthLabels();
  }

  private defaultMonthLabels(): string[] {
    return ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  }

  private visibleMonthsCount(): number {
    const now = new Date();
    const isCurrentYear = this.year === now.getFullYear();
    const isBeforeJuly = now.getMonth() < 6;

    return isCurrentYear && isBeforeJuly ? 6 : 12;
  }

  private toPercentage(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 1000) / 10;
  }

  private updatePercentageAxisMax(values: number[]): void {
    const yScale = this.barOptions.scales?.['y'];
    if (yScale) {
      yScale.max = values.some(value => value > 50) ? 100 : 50;
    }
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', {
      style: 'currency',
      currency: this.defaultCurrency,
      maximumFractionDigits: 0
    });
  }

  private formatPercentage(value: number): string {
    return `${value.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`;
  }
}
