import { Component, DestroyRef, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
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
import { AccountModel } from 'src/app/models/account.model';

type Currency = { code: string; name?: string };

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss']
})
export class SettingsModalComponent {
  @ViewChild('confirmDeleteAllTemplate') confirmDeleteAllTemplate!: TemplateRef<any>;
  @ViewChild('deleteTransactionsTemplate') deleteTransactionsTemplate!: TemplateRef<any>;
  @ViewChild('accountTransactionsWarningTemplate') accountTransactionsWarningTemplate!: TemplateRef<any>;

  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private storage = inject(StorageService);

  ClearTarget = ClearTarget;
  TransactionDeleteScope = TransactionDeleteScope;
  readonly userId = Number(this.storage.getUserId() || 1);

  currencySearchControl = new FormControl<string>('', { nonNullable: true });
  transactionDeleteForm = new FormGroup({
    scope: new FormControl<TransactionDeleteScope>(TransactionDeleteScope.ACCOUNT, { nonNullable: true }),
    accountId: new FormControl<number | null>(null)
  });

  currencies: Currency[] = [];
  filteredCurrencies: Currency[] = [];
  accounts: AccountModel[] = [];

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
    const fallback = 'it';
    const initLang = saved && this.availableLanguages.includes(saved)
      ? saved
      : browser && this.availableLanguages.includes(browser) ? browser : fallback;
    this.translateService.use(initLang);
    this.currentLang = initLang;

    this.translateService.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (this.availableLanguages.includes(event.lang)) {
          this.currentLang = event.lang;
        }
      });

    this.currencyService.getCurrencies().subscribe(data => {
      this.currencies = data;
      this.filteredCurrencies = data;
    });

    this.accountService.getAccounts(this.userId.toString()).subscribe(data => {
      this.accounts = data.sort((a, b) => a.name.localeCompare(b.name));
    });

    this.currencySearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.filterCurrencies(term));
  }

  close(): void {
    this.dialogRef.close();
  }

  clearAll(target: ClearTarget): void {
    if (target === ClearTarget.TRANSACTIONS) {
      this.openDeleteTransactionsDialog();
      return;
    }

    const configMap: Record<Exclude<ClearTarget, ClearTarget.TRANSACTIONS>, { title: string; message: string; action: () => Observable<any> }> = {
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

    if (target === ClearTarget.ACCOUNTS) {
      this.transactionService.getTransactions(this.userId.toString()).subscribe({
        next: transactions => {
          const accountIds = new Set(this.accounts.map(account => account.id));
          const hasAccountTransactions = transactions.some(transaction => accountIds.has(transaction.accountId));

          if (hasAccountTransactions) {
            this.openAccountTransactionsWarning();
            return;
          }

          this.openConfirmDeleteDialog(config);
        },
        error: err => console.error(err)
      });
      return;
    }

    this.openConfirmDeleteDialog(config);
  }

  canConfirmTransactionDeletion(): boolean {
    return this.transactionDeleteForm.controls.scope.value === TransactionDeleteScope.ALL
      || this.transactionDeleteForm.controls.accountId.value !== null;
  }

  setTransactionDeleteScope(scope: TransactionDeleteScope): void {
    this.transactionDeleteForm.controls.scope.setValue(scope);
  }

  private openDeleteTransactionsDialog(): void {
    this.transactionDeleteForm.reset({
      scope: TransactionDeleteScope.ACCOUNT,
      accountId: null
    });

    this.dialog
      .open(this.deleteTransactionsTemplate, {
        width: '440px',
        maxWidth: 'calc(100vw - 2rem)',
        panelClass: 'delete-dialog-template'
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed || !this.canConfirmTransactionDeletion()) return;

        const value = this.transactionDeleteForm.getRawValue();
        const accountId = value.scope === TransactionDeleteScope.ACCOUNT
          ? value.accountId ?? undefined
          : undefined;

        this.transactionService.deleteTransactions(accountId).subscribe({
          next: () => this.refreshService.triggerRefresh(),
          error: err => console.error(err)
        });
      });
  }

  private openConfirmDeleteDialog(config: { title: string; message: string; action: () => Observable<any> }): void {
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
          error: err => {
            if (err instanceof HttpErrorResponse && err.status === 409) {
              this.openAccountTransactionsWarning();
              return;
            }

            console.error(err);
          }
        });
      });
  }

  private openAccountTransactionsWarning(): void {
    this.dialog.open(this.accountTransactionsWarningTemplate, {
      width: '420px',
      maxWidth: 'calc(100vw - 2rem)',
      panelClass: 'delete-dialog-template'
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

enum TransactionDeleteScope {
  ACCOUNT = 'ACCOUNT',
  ALL = 'ALL'
}
