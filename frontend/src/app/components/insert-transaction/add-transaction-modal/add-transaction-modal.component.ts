import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TransactionModel } from './../../../models/transaction.model';

export interface AddTransactionModalData {
  transaction?: TransactionModel;
}

@Component({
  selector: 'app-add-transaction-modal',
  templateUrl: './add-transaction-modal.component.html',
  styleUrls: ['./add-transaction-modal.component.scss'],
})
export class AddTransactionModalComponent {
  constructor(
    public dialogRef: MatDialogRef<AddTransactionModalComponent, TransactionModel>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: AddTransactionModalData
  ) {}

  public isReady = true;

  get isEditMode(): boolean {
    return !!this.data?.transaction?.id;
  }

  close(): void {
    this.dialogRef.close();
  }

  handleSubmit(tx: TransactionModel): void {
    this.dialogRef.close(tx);
  }
}
