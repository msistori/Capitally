import { Component, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../auth/storage.service';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { TransactionModel } from 'src/app/models/transaction.model';
import { AddTransactionModalComponent } from '../insert-transaction/add-transaction-modal/add-transaction-modal.component';
import { SettingsModalComponent } from './../../pages/settings/settings-modal/settings-modal.component';

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

  constructor(private transactionDialog: MatDialog, private settingsDialog: MatDialog) { }

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
    this.router.navigate(['/dashboard']);
  }

  goToSummary(): void {
    this.router.navigate(['/dashboard']);
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
    return !!this.dialogTransactionModal;
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
    });
  }

  get transactionDialogOpen(): boolean {
    return !!this.dialogTransactionModal;
  }
}
