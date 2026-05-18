import { Component, Input, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FxRateService } from '../../services/fx-rate.service';
import { StorageService } from '../../auth/storage.service';

@Component({
  selector: 'app-balance-summary',
  templateUrl: './balance-summary.component.html',
  styleUrls: ['./balance-summary.component.scss']
})
export class BalanceSummaryComponent {
  private readonly totalBalanceSig = signal<Record<string, number>>({});

  @Input() set totalBalance(value: { [currencyCode: string]: number }) {
    this.totalBalanceSig.set(value || {});
  }

  private readonly ratesSig = signal<Record<string, number>>({});

  private storage = inject(StorageService);
  private fx = inject(FxRateService);

  readonly defaultCurrencySig = toSignal(this.storage.defaultCurrency$, {
    initialValue: this.storage.getDefaultCurrency()
  });

  constructor() {
    effect(() => {
      const def = this.defaultCurrencySig();
      this.fx.getRates(def).subscribe({
        next: r => this.ratesSig.set(r || {}),
        error: () => this.ratesSig.set({})
      });
    });
  }

  readonly entries = computed(() => {
    const tb = this.totalBalanceSig();
    return Object.keys(tb).map(code => ({ code, amount: Number(tb[code] || 0) }));
  });

  readonly convertedTotal = computed(() => {
    const def = this.defaultCurrencySig();
    const rates = this.ratesSig();

    const rateOf = (code: string) => {
      if (code === def) return 1;
      const r = rates?.[code];
      return r && r > 0 ? r : 0;
    };

    return this.entries().reduce((sum, e) => {
      const rate = rateOf(e.code);
      if (!rate) return sum;
      return sum + e.amount / rate;
    }, 0);
  });

  readonly showBreakdown = computed(() => {
    const list = this.entries();
    const def = this.defaultCurrencySig();
    return !(list.length === 1 && list[0].code === def);
  });
}
