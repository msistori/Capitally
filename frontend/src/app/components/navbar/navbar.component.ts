import { Component, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../auth/storage.service';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { TransactionModel } from 'src/app/models/transaction.model';
import { AddTransactionModalComponent } from '../insert-transaction/add-transaction-modal/add-transaction-modal.component';
import { SettingsModalComponent } from '../../pages/settings/settings-modal/settings-modal.component';
import { RefreshService } from 'src/app/services/refresh.service';
import { AnalyticsEvent } from 'src/app/analytics/analytics.events';
import { AnalyticsService } from 'src/app/analytics/analytics.service';
import { PRIVATE_ROUTES } from 'src/app/routing/localized-routes';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  private dialogTransactionModal?: MatDialogRef<AddTransactionModalComponent, TransactionModel>;
  private dialogSettingsModal?: MatDialogRef<SettingsModalComponent, void>;

  private router = inject(Router);
  private storage = inject(StorageService);
  private analytics = inject(AnalyticsService);

  constructor(
    private transactionDialog: MatDialog,
    private settingsDialog: MatDialog,
    private refreshService: RefreshService
  ) { }

  get showFab(): boolean {
    const token = this.storage.getAccessToken();
    const user = this.storage.getUser();
    const url = this.router.url || '';
    
    return (!!token || !!user) && !url.includes('/login');
  }

  goToHome(): void {
    this.router.navigate([PRIVATE_ROUTES.dashboard]);
  }

  goToAccounts(): void {
    this.router.navigate([PRIVATE_ROUTES.accounts]);
  }

  goToSummary(): void {
    this.router.navigate([PRIVATE_ROUTES.summary]);
  }

  openSettingsModal(): void {
    if (this.isLegalRoute()) {
      this.router.navigate([PRIVATE_ROUTES.dashboard]).then(navigated => {
        if (navigated) {
          this.openSettingsDialog();
        }
      });
      return;
    }

    this.openSettingsDialog();
  }

  private openSettingsDialog(): void {
    if (this.dialogSettingsModal) return;
    this.analytics.track(AnalyticsEvent.SETTINGS_OPENED);

    this.dialogSettingsModal = this.settingsDialog.open(SettingsModalComponent, {
      hasBackdrop: true,
      disableClose: false,
      closeOnNavigation: true,
      autoFocus: false,
      restoreFocus: false,
      panelClass: ['add-transaction-modal-panel', 'settings-modal-panel']
    });

    this.dialogSettingsModal.afterClosed().subscribe(() => {
      this.dialogSettingsModal = undefined;
    });
  }

  get settingsDialogOpen(): boolean {
    return !!this.dialogSettingsModal;
  }

  get anyDialogOpen(): boolean {
    return this.transactionDialogOpen || this.settingsDialogOpen;
  }

  openTransactionModal() {
    if (this.isLegalRoute()) {
      this.router.navigate([PRIVATE_ROUTES.dashboard]).then(navigated => {
        if (navigated) {
          this.openTransactionDialog();
        }
      });
      return;
    }

    this.openTransactionDialog();
  }

  private openTransactionDialog(): void {
    if (this.dialogTransactionModal) return;
    this.analytics.track(AnalyticsEvent.TRANSACTION_MODAL_OPENED);

    this.dialogTransactionModal = this.transactionDialog.open(AddTransactionModalComponent, {
      hasBackdrop: true,
      disableClose: false,
      closeOnNavigation: true,
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'add-transaction-modal-panel'
    });

    this.dialogTransactionModal.afterClosed().subscribe((tx) => {
      this.dialogTransactionModal = undefined;
      if (tx) {
        this.refreshService.triggerRefresh();
      }
    });
  }

  get transactionDialogOpen(): boolean {
    return !!this.dialogTransactionModal;
  }

  isRoute(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  private isLegalRoute(): boolean {
    return this.router.url.includes('/termini-condizioni')
      || this.router.url.includes('/terms-and-conditions')
      || this.router.url.includes('/privacy')
      || this.router.url.includes('/cookie-policy')
      || this.router.url.startsWith('/legal');
  }
}
