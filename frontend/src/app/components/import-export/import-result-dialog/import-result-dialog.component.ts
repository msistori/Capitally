import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImportExportCsvType } from 'src/app/models/import-export-transactions.model';

@Component({
  selector: 'app-import-result-dialog',
  templateUrl: './import-result-dialog.component.html',
  styleUrls: ['./import-result-dialog.component.scss']
})
export class ImportResultDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ImportResultDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  get importType(): ImportExportCsvType {
    return this.data.importType ?? 'transactions';
  }

  getImportedCount(): number {
    if (this.importType === 'accounts') {
      return this.data.summary?.importedAccounts ?? 0;
    }

    if (this.importType === 'transfers') {
      return this.data.summary?.importedTransfers ?? 0;
    }

    return this.data.summary?.importedTransactions ?? 0;
  }

  hasNewCategories(): boolean {
    return this.data.summary?.newCategories && 
           Object.keys(this.data.summary.newCategories).length > 0;
  }

  getCategoriesArray(): Array<{ account: string; categories: string[] }> {
    if (!this.data.summary?.newCategories) return [];
    
    return Object.entries(this.data.summary.newCategories).map(([account, categories]) => ({
      account,
      categories: categories as string[]
    }));
  }
}
