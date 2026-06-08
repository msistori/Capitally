import { Component, DestroyRef, Inject, Optional, TemplateRef, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
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
import { AnalyticsEvent } from 'src/app/analytics/analytics.events';
import { AnalyticsService } from 'src/app/analytics/analytics.service';
import { AppLanguage, LOCALIZED_ROUTES, isAppLanguage } from 'src/app/routing/localized-routes';

type Currency = { code: string; name?: string };
type SettingsModalData = { passwordChangeRequired?: boolean };

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
  private analytics = inject(AnalyticsService);

  ClearTarget = ClearTarget;
  TransactionDeleteScope = TransactionDeleteScope;
  readonly userId = Number(this.storage.getUserId() || 1);

  currencySearchControl = new FormControl<string>('', { nonNullable: true });
  transactionDeleteForm = new FormGroup({
    scope: new FormControl<TransactionDeleteScope>(TransactionDeleteScope.ACCOUNT, { nonNullable: true }),
    accountId: new FormControl<number | null>(null)
  });
  passwordForm = new FormGroup({
    currentPassword: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    newPassword: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    confirmPassword: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] })
  }, { validators: passwordMatchValidator });
  showPasswordForm = false;
  passwordChangeRequired = false;
  passwordSaving = false;
  passwordMessage: string | null = null;
  passwordError: string | null = null;

  currencies: Currency[] = [];
  filteredCurrencies: Currency[] = [];
  accounts: AccountModel[] = [];

  readonly availableLanguages = ['it', 'en'];
  currentLang!: AppLanguage;

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
    private storageService: StorageService,
    @Optional() @Inject(MAT_DIALOG_DATA) data?: SettingsModalData
  ) {
    this.passwordChangeRequired = !!data?.passwordChangeRequired;
    this.showPasswordForm = this.passwordChangeRequired;
    this.filteredCurrencies = [...this.currencies];
    this.translateService.addLangs(this.availableLanguages);
    const saved = localStorage.getItem('lang');
    const browser = this.translateService.getBrowserLang();
    const fallback = 'it';
    const initLang = isAppLanguage(saved)
      ? saved
      : isAppLanguage(browser) ? browser : fallback;
    this.translateService.use(initLang);
    this.currentLang = initLang;

    this.translateService.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (isAppLanguage(event.lang)) {
          this.currentLang = event.lang;
        }
      });

    this.currencyService.getCurrencies().subscribe(data => {
      this.currencies = data;
      this.filteredCurrencies = data;
    });

    this.accountService.getAccounts().subscribe(data => {
      this.accounts = data.sort((a, b) => a.name.localeCompare(b.name));
    });

    this.currencySearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.filterCurrencies(term));
  }

  close(): void {
    if (this.passwordChangeRequired) return;
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
      this.transactionService.getTransactions().subscribe({
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

  openPasswordForm(): void {
    this.showPasswordForm = true;
    this.passwordMessage = null;
    this.passwordError = null;
  }

  cancelPasswordChange(): void {
    if (this.passwordChangeRequired) return;
    this.resetPasswordForm();
    this.showPasswordForm = false;
  }

  changePassword(): void {
    this.passwordMessage = null;
    this.passwordError = null;

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.passwordError = this.passwordForm.hasError('passwordMismatch')
        ? this.translateService.instant('SETTINGS.PASSWORD.ERROR_MISMATCH') as string
        : this.translateService.instant('SETTINGS.PASSWORD.ERROR_REQUIRED') as string;
      return;
    }

    const value = this.passwordForm.getRawValue();
    this.passwordSaving = true;

    this.authService.changePassword({
      currentPassword: value.currentPassword,
      newPassword: value.newPassword
    }).subscribe({
      next: () => {
        const wasPasswordChangeRequired = this.passwordChangeRequired;
        this.passwordSaving = false;
        this.resetPasswordForm();
        this.passwordChangeRequired = false;
        this.showPasswordForm = false;
        this.passwordMessage = this.translateService.instant('SETTINGS.PASSWORD.SUCCESS') as string;
        this.markStoredPasswordAsChanged();

        if (wasPasswordChangeRequired) {
          this.close();
        }
      },
      error: err => {
        this.passwordSaving = false;
        const message = err?.error?.message || err?.error?.detail;
        this.passwordError = message === 'invalid_current_password'
          ? this.translateService.instant('SETTINGS.PASSWORD.ERROR_CURRENT') as string
          : this.translateService.instant('SETTINGS.PASSWORD.ERROR_GENERIC') as string;
      }
    });
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

  private resetPasswordForm(): void {
    this.passwordForm.reset();
    this.passwordForm.markAsPristine();
    this.passwordForm.markAsUntouched();
  }

  private markStoredPasswordAsChanged(): void {
    const user = this.storage.getUser();
    if (!user) return;

    this.storage.setUser({ ...user, passwordChangeRequired: false });
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
    this.router.navigate([LOCALIZED_ROUTES[this.currentLang].login]);
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
    this.analytics.track(AnalyticsEvent.SETTINGS_DEFAULT_CURRENCY_CHANGED, {
      currency_code: code
    });
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
    if (lang !== this.currentLang && isAppLanguage(lang)) {
      this.translateService.use(lang);
      this.currentLang = lang;
      localStorage.setItem('lang', lang);
      this.analytics.track(AnalyticsEvent.SETTINGS_LANGUAGE_CHANGED, {
        language: lang
      });
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

function passwordMatchValidator(control: AbstractControl) {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!newPassword || !confirmPassword || newPassword === confirmPassword) {
    return null;
  }

  return { passwordMismatch: true };
}
