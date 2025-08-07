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
  @Input() income = 0;
  @Input() expense = 0;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective<'doughnut'>;
  private noDataLabel: string;

  public chartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Income', 'Expense'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#22c55e', '#ef4444'],
      hoverBorderWidth: 7,
      hoverBorderColor: ['#22c55e', '#ef4444']
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
          const labels = ctx.chart.data.labels as string[];
          if (labels.length === 1 && labels[0] === 'No data') {
            return this.noDataLabel;
          }
          return value
            .toLocaleString('it-IT', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0
            });
        }
      }
    }
  };

  public chartPlugins = [ChartDataLabels, DoughnutCenterLogo];

  constructor(private translate: TranslateService) {
    this.noDataLabel = this.translate.instant('MONTHLY_SUMMARY.NO_DATA');
  }

  ngOnChanges(): void {
    const zero = this.income === 0 && this.expense === 0;
    if (zero) {
      this.chartData.labels = ['No data'];
      this.chartData.datasets = [{
        data: [1],
        backgroundColor: ['#005f73'],
        hoverBorderWidth: 0
      }];
    } else {
      this.chartData.labels = ['Income', 'Expense'];
      this.chartData.datasets = [{
        data: [this.income, this.expense],
        backgroundColor: ['#22c55e', '#ef4444'],
        hoverBorderWidth: 7,
        hoverBorderColor: ['#22c55e', '#ef4444']
      }];
    }
    this.chart?.update();
  }
}