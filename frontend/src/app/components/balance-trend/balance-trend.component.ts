import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
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

  @Input() year = new Date().getFullYear();
  @Input() loading = false;
  @Input() error = false;
  @Output() yearChange = new EventEmitter<number>();
  readonly maxYear = new Date().getFullYear();

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
      tooltip: {
        callbacks: {
          label: context => new Intl.NumberFormat(this.translateService.currentLang || 'en', {
            style: 'currency', currency: context.dataset.label || 'EUR'
          }).format(Number(context.parsed.y))
        }
      }
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
      line: { tension: 0 },
      point: { radius: 4, hitRadius: 12, backgroundColor: '#caf0f8', borderWidth: 0 }
    }
  };

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.buildChart();
    this.langSub = this.translateService.onLangChange.subscribe((_: LangChangeEvent) => this.buildChart());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('items' in changes || 'year' in changes) this.buildChart();
  }

  previousYear(): void {
    if (this.year > 1) this.yearChange.emit(this.year - 1);
  }

  nextYear(): void {
    if (this.year < this.maxYear) this.yearChange.emit(this.year + 1);
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  selectCurrency(code: string) {
    this.selectedCurrency = code;
    this.buildChart();
  }

  private buildChart(): void {
    const translated = this.translateService.instant('YEARLY_BALANCE_TREND.MONTH_NAMES');
    this.monthNames = Array.isArray(translated) ? translated : Array.from({ length: 12 }, (_, month) =>
      new Intl.DateTimeFormat(this.translateService.currentLang || 'en', { month: 'short' }).format(new Date(this.year, month, 1))
    );
    const monthsCount = 12;
    this.labels = this.monthNames.slice(0, monthsCount);
    this.labelStep = monthsCount > 8 ? 2 : 1;

    const dataForYear = this.items.filter(item => item.month.startsWith(String(this.year).padStart(4, '0') + '-'));
    this.currencies = Array.from(new Set(dataForYear.map(item => item.currency))).sort();
    if (this.selectedCurrency !== 'ALL' && !this.currencies.includes(this.selectedCurrency)) {
      this.selectedCurrency = 'ALL';
    }
    const filtered = this.selectedCurrency === 'ALL'
      ? dataForYear
      : dataForYear.filter(item => item.currency === this.selectedCurrency);
    this.datasets = this.toDatasets(this.groupByCurrency(filtered), monthsCount);
  }

  private groupByCurrency(data: BalanceTrendResponseDTO[]): Map<string, Map<number, number>> {
    const map = new Map<string, Map<number, number>>();
    data.forEach(item => {
      const mIdx = Number(item.month.slice(5, 7)) - 1;
      if (!map.has(item.currency)) map.set(item.currency, new Map<number, number>());
      map.get(item.currency)!.set(mIdx, Number(item.balance));
    });
    return map;
  }

  private toDatasets(byCurrency: Map<string, Map<number, number>>, monthsCount: number): Dataset[] {
    const palette = this.buildPalette();
    let colorIdx = 0;

    return Array.from(byCurrency.entries()).map(([currency, monthMap]) => {
      const data = Array.from({ length: monthsCount }, (_, i) => monthMap.get(i) ?? null);
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
