import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { StorageService } from '../auth/storage.service';
import { SettingsModalComponent } from '../pages/settings/settings-modal/settings-modal.component';

@Injectable({ providedIn: 'root' })
export class PasswordChangeEnforcementService {
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private storage = inject(StorageService);
  private dialogRef?: MatDialogRef<SettingsModalComponent, void>;

  enforceIfRequired(): void {
    const user = this.storage.getUser();
    const url = this.router.url || '';

    if (!url.startsWith('/app/') || !user?.passwordChangeRequired || this.dialogRef) {
      return;
    }

    this.dialogRef = this.dialog.open(SettingsModalComponent, {
      hasBackdrop: true,
      disableClose: true,
      closeOnNavigation: false,
      autoFocus: false,
      restoreFocus: false,
      panelClass: ['add-transaction-modal-panel', 'settings-modal-panel'],
      data: { passwordChangeRequired: true }
    });

    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = undefined;
      queueMicrotask(() => this.enforceIfRequired());
    });
  }
}
