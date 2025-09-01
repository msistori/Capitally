import { Component, Input, OnInit, computed, signal } from '@angular/core';
import { FxRateService } from '../../services/fx-rate.service';

@Component({
  selector: 'app-balance-summary',
  templateUrl: './balance-summary.component.html',
  styleUrls: ['./balance-summary.component.scss']
})
export class BalanceSummaryComponent implements OnInit {
  private readonly totalBalanceSig = signal<Record<string, number>>({});

  @Input() set totalBalance(value: { [currencyCode: string]: number }) {
    this.totalBalanceSig.set(value || {});
  }
  readonly defaultCurrency: string = 'EUR';

  private readonly ratesSig = signal<Record<string, number>>({});

  constructor(private fx: FxRateService) {}

  ngOnInit(): void {
    this.fx.getRates(this.defaultCurrency).subscribe({
      next: r => this.ratesSig.set(r),
      error: () => this.ratesSig.set({})
    });
  }

  readonly entries = computed(() => {
    const tb = this.totalBalanceSig();
    return Object.keys(tb).map(code => ({ code, amount: Number(tb[code] || 0) }));
  });

  readonly convertedTotal = computed(() => {
    const def = this.defaultCurrency;
    const rates = this.ratesSig();
    const rateOf = (code: string) => (code === def ? 1 : (rates?.[code] ?? 0));
    return this.entries().reduce((sum, e) => sum + e.amount * rateOf(e.code), 0);
  });
}
