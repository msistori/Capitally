import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TransactionModel } from './../../../models/transaction.model';

@Component({
  selector: 'app-add-transaction-modal',
  templateUrl: './add-transaction-modal.component.html',
  styleUrls: ['./add-transaction-modal.component.scss'],
})
export class AddTransactionModalComponent {
  constructor(public dialogRef: MatDialogRef<AddTransactionModalComponent, TransactionModel>) {}

  public isReady = true;

  close(): void {
    this.dialogRef.close();
  }

  handleSubmit(tx: TransactionModel): void {
    this.dialogRef.close(tx);
  }
}