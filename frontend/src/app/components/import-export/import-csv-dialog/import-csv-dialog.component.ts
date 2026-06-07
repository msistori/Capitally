import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ImportCsvDialogResult, ImportExportCsvType } from 'src/app/models/import-export-transactions.model';

@Component({
  selector: 'app-import-csv-dialog',
  templateUrl: './import-csv-dialog.component.html',
  styleUrls: ['./import-csv-dialog.component.scss']
})
export class ImportCsvDialogComponent {
  private readonly requiredCsvHeaders: Record<ImportExportCsvType, string[]> = {
    transactions: [
      'date',
      'macrocategory',
      'category',
      'account_name',
      'amount',
      'currency',
      'description',
      'transaction_type',
      'is_recurring',
      'recurrence_period',
      'recurrence_end_date'
    ],
    transfers: [
      'date',
      'source_account',
      'destination_account',
      'amount',
      'currency',
      'description'
    ],
    accounts: [
      'account_name',
      'currency',
      'initial_balance',
      'final_balance',
      'include_in_total_balance',
      'icon_name'
    ]
  };

  readonly importTypes: ImportExportCsvType[] = ['transactions', 'transfers', 'accounts'];

  selectedType: ImportExportCsvType = 'transactions';
  selectedFile: File | null = null;
  error: string = '';

  constructor(
    public dialogRef: MatDialogRef<ImportCsvDialogComponent>,
    private translateService: TranslateService
  ) {}

  selectType(type: ImportExportCsvType): void {
    if (this.selectedType === type) return;

    this.selectedType = type;
    if (this.selectedFile) {
      void this.validateAndSetFile(this.selectedFile);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      void this.validateAndSetFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      void this.validateAndSetFile(file);
    }
  }

  async validateAndSetFile(file: File): Promise<void> {
    this.error = '';
    this.selectedFile = null;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.error = this.translateService.instant('SETTINGS.IMPORT_EXPORT.IMPORT.FORMAT_ERROR') as string;
      return;
    }

    const hasValidHeader = await this.hasValidCsvHeader(file);
    if (!hasValidHeader) {
      this.error = this.translateService.instant('SETTINGS.IMPORT_EXPORT.IMPORT.HEADER_ERROR') as string;
      return;
    }
    
    this.selectedFile = file;
  }

  private async hasValidCsvHeader(file: File): Promise<boolean> {
    try {
      const content = await file.slice(0, 4096).text();
      const firstLine = content.split(/\r?\n/).find(line => line.trim());
      if (!firstLine) {
        return false;
      }

      const headers = firstLine
        .replace(/^\uFEFF/, '')
        .split(';')
        .map(header => header.trim().toLowerCase());

      return this.requiredCsvHeaders[this.selectedType].every(header => headers.includes(header));
    } catch {
      return false;
    }
  }

  onConfirm(): void {
    if (this.selectedFile) {
      this.dialogRef.close({
        file: this.selectedFile,
        type: this.selectedType
      } satisfies ImportCsvDialogResult);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
