import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const logoImg = new Image();
logoImg.src = 'assets/logo.svg';

const DoughnutCenterLogo = {
  id: 'doughnutCenterLogo',
  afterDatasetsDraw(chart: any) {
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data.length) return;
    const { x, y, innerRadius } = meta.data[0];
    const size = innerRadius * 2;
    const ctx = chart.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }
};

@Component({
  selector: 'app-monthly-summary',
  templateUrl: './monthly-summary.component.html',
  styleUrls: ['./monthly-summary.component.scss']
})
export class MonthlySummaryComponent implements OnChanges {
  @Input() income: { [currencyCode: string]: number } = {};
  @Input() expense: { [currencyCode: string]: number } = {};
  defaultCurrency = 'EUR';

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective<'doughnut'>;

  private noDataLabel: string;
  private isNoData = true;

  public chartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['NO_DATA'],
    datasets: [{
      label: 'NO_DATA',
      data: [1],
      backgroundColor: ['#005f73'],
      borderWidth: 0,
      hoverBorderWidth: 0
    }]
  };

  public chartOptions: ChartOptions<'doughnut'> = {
    cutout: '40%',
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 20 },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold', size: 14 },
        formatter: (value, ctx) => {
          const isNoData = ctx.dataset?.label === 'NO_DATA';
          if (isNoData) return this.noDataLabel;
          const n = Number(value ?? 0);
          return n.toLocaleString('it-IT', {
            style: 'currency',
            currency: this.defaultCurrency,
            maximumFractionDigits: 0
          });
        }
      }
    }
  };

  public chartPlugins = [ChartDataLabels, DoughnutCenterLogo];

  constructor(private translate: TranslateService) {
    this.noDataLabel = this.translate.instant('MONTHLY_SUMMARY.NO_DATA');
    this.translate.onLangChange.subscribe(() => {
      this.noDataLabel = this.translate.instant('MONTHLY_SUMMARY.NO_DATA');
      if (this.isNoData) this.setNoDataState();
      this.chart?.update();
    });
  }

  ngOnChanges(): void {
    const incomeVal = Number(this.income?.[this.defaultCurrency] ?? 0);
    const expenseVal = Number(this.expense?.[this.defaultCurrency] ?? 0);
    this.isNoData = incomeVal === 0 && expenseVal === 0;

    if (this.isNoData) {
      this.setNoDataState();
    } else {
      this.chartData = {
        labels: ['Income', 'Expense'],
        datasets: [{
          label: 'DATA',
          data: [incomeVal, expenseVal],
          backgroundColor: ['#22c55e', '#ef4444'],
          hoverBorderWidth: 7,
          borderWidth: 0,
          hoverBorderColor: ['#22c55e', '#ef4444']
        }]
      };
    }

    this.chart?.update();
  }

  private setNoDataState(): void {
    this.chartData = {
      labels: ['NO_DATA'],
      datasets: [{
        label: 'NO_DATA',
        data: [1],
        backgroundColor: ['#005f73'],
        borderWidth: 0,
        hoverBorderWidth: 0
      }]
    };
  }
}
