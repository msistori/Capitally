import { Component, DestroyRef, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { StorageService } from 'src/app/auth/storage.service';
import { AccountService } from 'src/app/services/account.service';
import { AuthService } from 'src/app/services/auth.service';
import { CategoryService } from 'src/app/services/category.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { CurrencyService } from 'src/app/services/currency.service';

type Currency = { code: string; name?: string };

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss']
})
export class SettingsModalComponent {
  @ViewChild('confirmDeleteAllTemplate') confirmDeleteAllTemplate!: TemplateRef<any>;

  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private storage = inject(StorageService);

  ClearTarget = ClearTarget;

  currencySearchControl = new FormControl<string>('', { nonNullable: true });

  currencies: Currency[] = [];
  filteredCurrencies: Currency[] = [];

  readonly availableLanguages = ['it', 'en'];
  currentLang!: string;

  selectedCurrencyCode = this.storage.getDefaultCurrency();

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<SettingsModalComponent, void>,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private accountService: AccountService,
    private currencyService: CurrencyService,
    private refreshService: RefreshService,
    private authService: AuthService,
    private translateService: TranslateService,
    private storageService: StorageService
  ) {
    this.filteredCurrencies = [...this.currencies];
    this.translateService.addLangs(this.availableLanguages);
    const saved = localStorage.getItem('lang');
    const browser = this.translateService.getBrowserLang();
    const fallback = 'en';
    const initLang = saved && this.availableLanguages.includes(saved)
      ? saved
      : browser && this.availableLanguages.includes(browser) ? browser : fallback;
    this.translateService.use(initLang);
    this.currentLang = initLang;

    this.currencyService.getCurrencies().subscribe(data => {
      this.currencies = data;
      this.filteredCurrencies = data;
    });

    this.currencySearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.filterCurrencies(term));
  }

  close(): void {
    this.dialogRef.close();
  }

  clearAll(target: ClearTarget): void {
    const configMap: Record<ClearTarget, { title: string; message: string; action: () => Observable<any> }> = {
      [ClearTarget.TRANSACTIONS]: {
        title: this.translateService.instant('SETTINGS.TEMPLATE.TRANSACTIONS.TITLE') as string,
        message: this.translateService.instant('SETTINGS.TEMPLATE.TRANSACTIONS.MESSAGE') as string,
        action: () => this.transactionService.deleteTransactions()
      },
      [ClearTarget.CATEGORIES]: {
        title: this.translateService.instant('SETTINGS.TEMPLATE.CATEGORIES.TITLE') as string,
        message: this.translateService.instant('SETTINGS.TEMPLATE.CATEGORIES.MESSAGE') as string,
        action: () => this.categoryService.deleteCategories()
      },
      [ClearTarget.ACCOUNTS]: {
        title: this.translateService.instant('SETTINGS.TEMPLATE.ACCOUNTS.TITLE') as string,
        message: this.translateService.instant('SETTINGS.TEMPLATE.ACCOUNTS.MESSAGE') as string,
        action: () => this.accountService.deleteAccounts()
      }
    };

    const config = configMap[target];

    this.dialog
      .open(this.confirmDeleteAllTemplate, {
        width: '400px',
        maxWidth: 'calc(100vw - 2rem)',
        panelClass: 'delete-dialog-template',
        data: { title: config.title, message: config.message }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed) return;

        config.action().subscribe({
          next: () => this.refreshService.triggerRefresh(),
          error: err => console.error(err)
        });
      });
  }

  logout(): void {
    this.authService.logout();
    this.close();
    this.router.navigate(['/login']);
  }

  onCurrencyPanelOpenChange(opened: boolean): void {
    if (!opened) {
      this.currencySearchControl.setValue('');
      this.filteredCurrencies = [...this.currencies];
    }
  }

  onCurrencyChange(code: string): void {
    this.selectedCurrencyCode = code;
    this.storageService.setDefaultCurrency(code);
  }

  filterCurrencies(searchTerm: string): void {
    const term = (searchTerm || '').toLowerCase().trim();
    const currentCode = this.selectedCurrencyCode;

    if (!term) {
      this.filteredCurrencies = [...this.currencies];
      return;
    }

    const filtered = this.currencies.filter(cur =>
      cur.code.toLowerCase().includes(term) || (cur.name?.toLowerCase().includes(term) ?? false)
    );

    const currentCur = this.currencies.find(c => c.code === currentCode);
    const isCurrentInFiltered = filtered.some(c => c.code === currentCode);

    this.filteredCurrencies = currentCur && !isCurrentInFiltered ? [currentCur, ...filtered] : filtered;
  }

  shouldHideCurrent(cur: Currency, index: number): boolean {
    const searchTerm = this.currencySearchControl.value;
    const currentCode = this.selectedCurrencyCode;

    if (index !== 0 || !searchTerm || cur.code !== currentCode) return false;

    const term = searchTerm.toLowerCase();
    const matches =
      cur.code.toLowerCase().includes(term) || (cur.name?.toLowerCase().includes(term) ?? false);

    return !matches;
  }

  changeLanguage(lang: string): void {
    if (lang !== this.currentLang && this.availableLanguages.includes(lang)) {
      this.translateService.use(lang);
      this.currentLang = lang;
      localStorage.setItem('lang', lang);
    }
  }
}

enum ClearTarget {
  TRANSACTIONS = 'TRANSACTIONS',
  CATEGORIES = 'CATEGORIES',
  ACCOUNTS = 'ACCOUNTS'
}
