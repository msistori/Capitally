import { Component, Input, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FxRateService } from '../../services/fx-rate.service';
import { StorageService } from '../../auth/storage.service';
import { AccountBalanceResponseDTO } from '../../models/dashboard.model';

@Component({
  selector: 'app-balance-summary',
  templateUrl: './balance-summary.component.html',
  styleUrls: ['./balance-summary.component.scss']
})
export class BalanceSummaryComponent {
  private readonly totalBalanceSig = signal<Record<string, number>>({});
  private readonly accountBalancesSig = signal<AccountBalanceResponseDTO[]>([]);

  @Input() set totalBalance(value: { [currencyCode: string]: number }) {
    this.totalBalanceSig.set(value || {});
  }

  @Input() set accountBalances(value: AccountBalanceResponseDTO[] | null | undefined) {
    this.accountBalancesSig.set(value || []);
  }

  private readonly ratesSig = signal<Record<string, number>>({});

  private storage = inject(StorageService);
  private fx = inject(FxRateService);

  readonly defaultCurrencySig = toSignal(this.storage.defaultCurrency$, {
    initialValue: this.storage.getDefaultCurrency()
  });
  readonly balancesVisibleSig = toSignal(this.storage.balanceVisibility$, {
    initialValue: this.storage.areBalancesVisible()
  });

  constructor() {
    effect((onCleanup) => {
      const def = this.defaultCurrencySig();
      const sub = this.fx.getRates(def).subscribe({
        next: r => this.ratesSig.set(r || {}),
        error: () => this.ratesSig.set({})
      });

      onCleanup(() => sub.unsubscribe());
    }, { allowSignalWrites: true });
  }

  readonly entries = computed(() => {
    const tb = this.totalBalanceSig();
    return Object.keys(tb).map(code => ({ code, amount: Number(tb[code] || 0) }));
  });

  readonly currencyEntries = computed(() => {
    return this.entries()
      .filter(item => Number.isFinite(item.amount) && item.amount !== 0)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount) || a.code.localeCompare(b.code))
      .slice(0, 3);
  });

  readonly hasMultipleCurrencies = computed(() => this.currencyEntries().length > 1);

  readonly accountEntries = computed(() => {
    if (this.hasMultipleCurrencies()) {
      return [];
    }

    return this.accountBalancesSig()
      .filter(item => Number(item.balance || 0) !== 0)
      .map(item => ({
        ...item,
        balance: Number(item.balance || 0),
        iconName: item.iconName || 'account_balance_wallet'
      }))
      .sort((a, b) => {
        const balanceDistance = Math.abs(b.balance) - Math.abs(a.balance);
        return balanceDistance || a.accountName.localeCompare(b.accountName) || a.currency.localeCompare(b.currency);
      })
      .slice(0, 3);
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
    return this.hasMultipleCurrencies();
  });

  trackByAccountBalance(_: number, item: AccountBalanceResponseDTO): string {
    return `${item.accountId}-${item.currency}`;
  }

  toggleBalancesVisibility(): void {
    this.storage.setBalancesVisible(!this.balancesVisibleSig());
  }
}
