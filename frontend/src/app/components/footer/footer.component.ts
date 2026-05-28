import { Component, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../auth/storage.service';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { TransactionModel } from 'src/app/models/transaction.model';
import { AddTransactionModalComponent } from '../insert-transaction/add-transaction-modal/add-transaction-modal.component';
import { SettingsModalComponent } from './../../pages/settings/settings-modal/settings-modal.component';
import { RefreshService } from 'src/app/services/refresh.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  private dialogTransactionModal?: MatDialogRef<AddTransactionModalComponent, TransactionModel>;
  private dialogSettingsModal?: MatDialogRef<SettingsModalComponent, void>;

  private router = inject(Router);
  private storage = inject(StorageService);

  constructor(
    private transactionDialog: MatDialog,
    private settingsDialog: MatDialog,
    private refreshService: RefreshService
  ) { }

  get showFab(): boolean {
    const token = this.storage.getAccessToken();
    const user = this.storage.getUser();
    const url = this.router.url || '';
    
    return (!!token || !!user) && !url.startsWith('/login');
  }

  goToHome(): void {
    this.router.navigate(['/dashboard']);
  }

  goToAccounts(): void {
    this.router.navigate(['/accounts']);
  }

  goToSummary(): void {
    this.router.navigate(['/summary']);
  }

  openSettingsModal(): void {
    if (this.dialogSettingsModal) return;

    this.dialogSettingsModal = this.settingsDialog.open(SettingsModalComponent, {
      hasBackdrop: true,
      disableClose: false,
      closeOnNavigation: true,
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
    if (this.dialogTransactionModal) return;

    this.dialogTransactionModal = this.transactionDialog.open(AddTransactionModalComponent, {
      hasBackdrop: true,
      disableClose: false,
      closeOnNavigation: true,
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
}
