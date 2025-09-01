import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BalanceTrendResponseDTO } from './../../models/dashboard.model';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

type Dataset = ChartConfiguration<'line'>['data']['datasets'][number];

@Component({
  selector: 'app-balance-trend',
  templateUrl: './balance-trend.component.html',
  styleUrls: ['./balance-trend.component.scss']
})
export class BalanceTrendComponent implements OnInit, OnChanges, OnDestroy {
  @Input() items: BalanceTrendResponseDTO[] = [];

  loading = signal(false);
  error = signal<string | null>(null);

  labels: string[] = [];
  datasets: Dataset[] = [];
  currencies: string[] = [];
  monthNames: string[] = [];

  selectedCurrency = 'ALL';
  private labelStep = 1;
  private langSub?: Subscription;

  lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      legend: {
        display: true,
        labels: { usePointStyle: true, pointStyle: 'roundedRect', padding: 16, color: '#005f73' }
      },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          color: '#005f73',
          callback: (_value: any, index: number) => index % this.labelStep === 0 ? (this.labels[index] ?? '') : ''
        },
        grid: { color: '#005f7333' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#005f73' },
        grid: { color: '#005f7333' }
      }
    },
    elements: {
      line: { tension: 0.25 },
      point: { radius: 4, hitRadius: 12, backgroundColor: '#caf0f8', borderWidth: 0 }
    }
  };

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.monthNames = (this.translateService.instant('YEARLY_BALANCE_TREND.MONTH_NAMES') as string[]);
    this.langSub = this.translateService.onLangChange.subscribe((_: LangChangeEvent) => {
      const months = this.translateService.instant('YEARLY_BALANCE_TREND.MONTH_NAMES') as string[] | string;
      this.monthNames = Array.isArray(months) ? months : this.monthNames;
      if (this.items?.length) {
        const year = this.detectYear(this.items);
        const lastMonthIdx = this.findLastMonthIndex(this.items, year);
        this.labels = this.buildMonthLabels(lastMonthIdx);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('items' in changes) this.buildChart();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  selectCurrency(code: string) {
    this.selectedCurrency = code;
    this.buildChart();
  }

  private buildChart(): void {
    this.loading.set(true);
    this.error.set(null);

    try {
      const year = this.detectYear(this.items);
      const lastMonthIdx = this.findLastMonthIndex(this.items, year);
      this.labels = this.buildMonthLabels(lastMonthIdx);
      this.labelStep = this.computeLabelStep(this.labels.length);

      this.currencies = Array.from(new Set(this.items.map(i => i.currency))).sort();

      const dataForYear = this.items.filter(i => i.month.startsWith(String(year)));
      const filtered = this.selectedCurrency === 'ALL' ? dataForYear : dataForYear.filter(i => i.currency === this.selectedCurrency);

      const byCurrency = this.groupByCurrency(filtered);
      this.datasets = this.toDatasets(byCurrency, this.labels.length);

      this.loading.set(false);
    } catch (e) {
      this.error.set('Unable to build chart');
      this.loading.set(false);
      console.error(e);
    }
  }

  private computeLabelStep(n: number): number {
    if (n <= 8) return 1;
    if (n <= 12) return 2;
    return Math.ceil(n / 6);
  }

  private detectYear(items: BalanceTrendResponseDTO[]): number {
    if (!items?.length) return new Date().getFullYear();
    return Number(items[0].month.slice(0, 4));
  }

  private findLastMonthIndex(items: BalanceTrendResponseDTO[], year: number): number {
    const months = items
      .filter(i => i.month.startsWith(String(year)))
      .map(i => Number(i.month.slice(5, 7)) - 1)
      .filter(m => m >= 0 && m <= 11);
    if (months.length === 0) {
      const now = new Date();
      return now.getFullYear() === year ? now.getMonth() : 11;
    }
    return Math.max(...months);
  }

  private buildMonthLabels(lastMonthIdx: number): string[] {
    return this.monthNames.slice(0, lastMonthIdx + 1);
  }

  private groupByCurrency(data: BalanceTrendResponseDTO[]): Map<string, Map<number, number>> {
    const map = new Map<string, Map<number, number>>();
    data.forEach(item => {
      const mIdx = Number(item.month.slice(5, 7)) - 1;
      if (!map.has(item.currency)) map.set(item.currency, new Map<number, number>());
      map.get(item.currency)!.set(mIdx, item.balance);
    });
    return map;
  }

  private toDatasets(byCurrency: Map<string, Map<number, number>>, monthsCount: number): Dataset[] {
    const palette = this.buildPalette();
    let colorIdx = 0;

    return Array.from(byCurrency.entries()).map(([currency, monthMap]) => {
      const data = Array.from({ length: monthsCount }, (_, i) => monthMap.get(i) ?? 0);
      const c = palette[colorIdx++ % palette.length];
      return {
        label: currency,
        data,
        fill: 'origin',
        borderColor: c.border,
        backgroundColor: c.bg,
        pointStyle: 'roundedRect',
        pointBackgroundColor: c.border,
        pointBorderColor: c.border,
        pointBorderWidth: 2,
        pointRadius: 4
      } as Dataset;
    });
  }

  private buildPalette() {
    const hex = ['#005f73', '#caf0f8', '#0a9396', '#51917bff', '#3a86ff', '#0038eeff'];
    const toRGBA = (h: string, a: number) =>
      `rgba(${parseInt(h.slice(1,3),16)}, ${parseInt(h.slice(3,5),16)}, ${parseInt(h.slice(5,7),16)}, ${a})`;
    return hex.map(h => ({ border: h, bg: toRGBA(h, 0.15) }));
  }
}
