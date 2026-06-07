import { AfterViewInit, Component, ElementRef, Inject, Optional } from '@angular/core';
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
export class AddTransactionModalComponent implements AfterViewInit {
  constructor(
    public dialogRef: MatDialogRef<AddTransactionModalComponent, TransactionModel>,
    private elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: AddTransactionModalData
  ) {}

  public isReady = true;

  ngAfterViewInit(): void {
    setTimeout(() => {
      const host = this.elementRef.nativeElement;
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement && host.contains(activeElement)) {
        activeElement.blur();
      }

      host.closest<HTMLElement>('.mat-mdc-dialog-container')?.scrollTo({ top: 0, left: 0 });
      host.closest<HTMLElement>('.mat-mdc-dialog-surface')?.scrollTo({ top: 0, left: 0 });
    });
  }

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
