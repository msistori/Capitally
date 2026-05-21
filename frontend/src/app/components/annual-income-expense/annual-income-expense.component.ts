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
  readonly maxYear = new Date().getFullYear();

  private monthNames: string[] = [];
  private langSub?: Subscription;
  private currencySub?: Subscription;
  private rawDatasetValues: number[][] = [];
  private compressionThreshold: number | null = null;
  private yAxisTicks: number[] = [];

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
            const label = context.dataset.label ?? '';
            const value = this.rawDatasetValues[context.datasetIndex]?.[context.dataIndex] ?? Number(context.parsed.y ?? 0);
            return `${label}: ${this.formatCurrency(value)}`;
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
        afterBuildTicks: scale => {
          if (this.yAxisTicks.length) {
            scale.ticks = this.yAxisTicks.map(value => ({ value: this.toChartValue(value) }));
          }
        },
        ticks: {
          color: '#005f73',
          callback: value => this.formatCurrency(this.restoreChartValue(Number(value)))
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
    this.buildChart();

    this.langSub = this.translateService.onLangChange.subscribe((_: LangChangeEvent) => {
      this.monthNames = this.readMonthNames();
      this.buildChart();
    });

    this.currencySub = this.storage.defaultCurrency$.subscribe(currency => {
      this.defaultCurrency = currency;
      this.buildChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('items' in changes) this.buildChart();
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
    const monthsCount = 12;
    this.labels = this.monthNames.length ? this.monthNames.slice(0, monthsCount) : this.defaultMonthLabels();

    const totals = new Map<number, { income: number; expense: number }>();
    for (const item of this.items || []) {
      if (item.currency !== this.defaultCurrency) continue;

      const monthIndex = Number(item.month.slice(5, 7)) - 1;
      if (monthIndex < 0 || monthIndex > 11) continue;

      const current = totals.get(monthIndex) ?? { income: 0, expense: 0 };
      current.income += Number(item.income ?? 0);
      current.expense += Number(item.expense ?? 0);
      totals.set(monthIndex, current);
    }

    const incomeData = Array.from({ length: monthsCount }, (_, index) => totals.get(index)?.income ?? 0);
    const expenseData = Array.from({ length: monthsCount }, (_, index) => totals.get(index)?.expense ?? 0);
    this.noData = [...incomeData, ...expenseData].every(value => value === 0);
    this.rawDatasetValues = [incomeData, expenseData];
    this.compressionThreshold = this.findCompressionThreshold([...incomeData, ...expenseData]);
    this.yAxisTicks = this.buildYAxisTicks([...incomeData, ...expenseData]);
    this.setYAxisBounds();

    this.datasets = [
      {
        label: this.translateService.instant('ANNUAL_INCOME_EXPENSE.INCOMES'),
        data: incomeData.map(value => this.toChartValue(value)),
        backgroundColor: '#22c55e',
        borderRadius: 6,
        maxBarThickness: 28
      },
      {
        label: this.translateService.instant('ANNUAL_INCOME_EXPENSE.EXPENSES'),
        data: expenseData.map(value => this.toChartValue(value)),
        backgroundColor: '#ef4444',
        borderRadius: 6,
        maxBarThickness: 28
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

  private findCompressionThreshold(values: number[]): number | null {
    const nonZeroValues = values
      .map(value => Math.abs(value))
      .filter(value => value > 0)
      .sort((a, b) => a - b);

    if (nonZeroValues.length < 3) return null;

    const median = this.percentile(nonZeroValues, 0.5);
    const max = nonZeroValues[nonZeroValues.length - 1];
    const threshold = median * 3;

    return threshold > 0 && max > threshold * 1.6 ? threshold : null;
  }

  private percentile(sortedValues: number[], percentile: number): number {
    const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor((sortedValues.length - 1) * percentile)));
    return sortedValues[index];
  }

  private toChartValue(value: number): number {
    if (!this.compressionThreshold) return value;

    const sign = Math.sign(value);
    const absoluteValue = Math.abs(value);
    if (absoluteValue <= this.compressionThreshold) return value;

    const compressedValue = this.compressionThreshold
      + Math.sqrt(absoluteValue - this.compressionThreshold) * Math.sqrt(this.compressionThreshold);

    return sign * compressedValue;
  }

  private restoreChartValue(value: number): number {
    if (!this.compressionThreshold) return value;

    const sign = Math.sign(value);
    const absoluteValue = Math.abs(value);
    if (absoluteValue <= this.compressionThreshold) return value;

    const restoredValue = this.compressionThreshold
      + Math.pow(absoluteValue - this.compressionThreshold, 2) / this.compressionThreshold;

    return sign * restoredValue;
  }

  private buildYAxisTicks(values: number[]): number[] {
    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(0, ...values);

    if (this.compressionThreshold) {
      return this.buildCompressedYAxisTicks(minValue, maxValue, this.compressionThreshold);
    }

    const maxAbsolute = Math.max(Math.abs(minValue), Math.abs(maxValue));

    if (maxAbsolute === 0) return [0, 10];

    const step = this.chooseNiceStep(maxAbsolute / 4);
    const minTick = Math.floor(minValue / step) * step;
    const maxTick = Math.ceil(maxValue / step) * step;
    const ticks: number[] = [];

    for (let value = minTick; value <= maxTick; value += step) {
      ticks.push(value);
    }

    return ticks.length ? ticks : [0, step];
  }

  private buildCompressedYAxisTicks(minValue: number, maxValue: number, threshold: number): number[] {
    const ticks = new Set<number>([0]);
    const lowerStep = this.chooseNiceStep(threshold / 5);
    const upperStep = this.chooseNiceStep(Math.max(lowerStep, (maxValue - threshold) / 3));
    const minTick = Math.floor(minValue / lowerStep) * lowerStep;
    const thresholdTick = Math.ceil(threshold / lowerStep) * lowerStep;
    const maxTick = Math.ceil(maxValue / upperStep) * upperStep;

    for (let value = minTick; value <= Math.min(thresholdTick, maxTick); value += lowerStep) {
      ticks.add(value);
    }

    for (let value = Math.ceil((thresholdTick + upperStep) / upperStep) * upperStep; value <= maxTick; value += upperStep) {
      ticks.add(value);
    }

    return Array.from(ticks).sort((a, b) => a - b);
  }

  private chooseNiceStep(rawStep: number): number {
    const minStep = 10;
    if (rawStep <= minStep) return minStep;

    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

    return Math.max(minStep, multiplier * magnitude);
  }

  private setYAxisBounds(): void {
    const yScale = this.barOptions.scales?.['y'] as any;
    if (!yScale || !this.yAxisTicks.length) return;

    yScale.min = this.toChartValue(this.yAxisTicks[0]);
    yScale.max = this.toChartValue(this.yAxisTicks[this.yAxisTicks.length - 1]);
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', {
      style: 'currency',
      currency: this.defaultCurrency,
      maximumFractionDigits: 0
    });
  }
}
