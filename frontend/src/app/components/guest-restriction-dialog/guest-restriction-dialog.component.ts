import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LOCALIZED_ROUTES, currentOrDefaultLanguage } from '../../routing/localized-routes';

@Component({
  selector: 'app-guest-restriction-dialog',
  templateUrl: './guest-restriction-dialog.component.html',
  styleUrls: ['./guest-restriction-dialog.component.scss']
})
export class GuestRestrictionDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<GuestRestrictionDialogComponent>,
    private dialog: MatDialog,
    private router: Router
  ) {}

  onClose() {
    this.dialogRef.close();
  }

  onLogin() {
    this.dialog.closeAll();
    const language = currentOrDefaultLanguage(this.router.url, localStorage.getItem('lang'));
    this.router.navigate([LOCALIZED_ROUTES[language].login]);
  }
}
