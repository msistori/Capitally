import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddTransactionModalComponent } from '../add-transaction-modal/add-transaction-modal.component';
import { TransactionModel } from './../../../models/transaction.model';

@Component({
  selector: 'app-add-transaction-fab',
  templateUrl: './add-transaction-fab.component.html',
  styleUrls: ['./add-transaction-fab.component.scss'],
})
export class AddTransactionFabComponent {
  private dialogRef?: MatDialogRef<AddTransactionModalComponent, TransactionModel>;

  constructor(private dialog: MatDialog) {}

  open(): void {
    if (this.dialogRef) return;

    this.dialogRef = this.dialog.open(AddTransactionModalComponent, {
      hasBackdrop: true,
      disableClose: false,
      closeOnNavigation: true,
      panelClass: 'add-transaction-modal-panel'
    });

    this.dialogRef.afterClosed().subscribe((tx) => {
      if (tx) {
        console.log('Nuova transazione:', tx);
        // salva transazione se serve
      }
      this.dialogRef = undefined;
    });
  }

  get dialogOpen(): boolean {
    return !!this.dialogRef;
  }
}