import { HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { TransactionExportFilterInputDTO } from 'src/app/models/import-export-transactions.model';
import { TransactionTypeEnum } from 'src/app/models/transaction.model';
import { ImportExportTransactionsService } from 'src/app/services/import-export-transactions.service';

@Component({
  selector: 'app-export-csv-dialog',
  templateUrl: './export-csv-dialog.component.html',
  styleUrls: ['./export-csv-dialog.component.scss']
})
export class ExportCsvDialogComponent {
  exporting = false;
  
  readonly TransactionTypeEnum = TransactionTypeEnum;
  readonly transactionTypes = [TransactionTypeEnum.INCOME, TransactionTypeEnum.EXPENSE];
  
  form = this.fb.group(
    {
      account: [''],
      minAmount: [null as number | null, [Validators.min(0)]],
      maxAmount: [null as number | null, [Validators.min(0)]],
      description: [''],
      startDate: [null as Date | null],
      endDate: [null as Date | null],
      macroCategory: [''],
      category: [''],
      currency: [''],
      transactionType: [null as TransactionTypeEnum | null]
    },
    { validators: [this.amountRangeValidator, this.dateRangeValidator] }
  );
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ExportCsvDialogComponent>,
    private txService: ImportExportTransactionsService
  ) {}
  
  close(): void {
    this.dialogRef.close(false);
  }
  
  export(): void {
    if (this.exporting) return;
    
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    
    const filter = this.toFilter();
    
    this.exporting = true;
    this.txService
    .getExportTransactions(filter)
    .pipe(finalize(() => (this.exporting = false)))
    .subscribe({
      next: (res: HttpResponse<Blob>) => this.handleDownload(res),
      error: () => {
      }
    });
  }
  
  private handleDownload(res: HttpResponse<Blob>): void {
    const blob = res.body;
    if (!blob) return;
    
    const filename =
    this.extractFilename(res.headers.get('content-disposition')) ??
    this.defaultFilename();
    
    this.downloadBlob(blob, filename);
    this.dialogRef.close(true);
  }
  
  private toFilter(): TransactionExportFilterInputDTO {
    const v = this.form.value;
    
    return {
      account: this.trimOrUndefined(v.account),
      minAmount: v.minAmount ?? undefined,
      maxAmount: v.maxAmount ?? undefined,
      description: this.trimOrUndefined(v.description),
      startDate: v.startDate ? this.toIsoDate(v.startDate) : undefined,
      endDate: v.endDate ? this.toIsoDate(v.endDate) : undefined,
      macroCategory: this.trimOrUndefined(v.macroCategory),
      category: this.trimOrUndefined(v.category),
      currency: this.trimOrUndefined(v.currency)?.toUpperCase(),
      transactionType: v.transactionType ?? undefined
    };
  }
  
  private trimOrUndefined(v: unknown): string | undefined {
    const s = String(v ?? '').trim();
    return s ? s : undefined;
  }
  
  private toIsoDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  
  private defaultFilename(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `transactions_${yyyy}-${mm}-${dd}.csv`;
  }
  
  private extractFilename(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;
    
    const m1 = /filename="([^"]+)"/.exec(contentDisposition);
    if (m1?.[1]) return m1[1];
    
    const m2 = /filename\*\=UTF-8''([^;]+)/.exec(contentDisposition);
    if (m2?.[1]) return decodeURIComponent(m2[1]);
    
    return null;
  }
  
  private amountRangeValidator(group: any) {
    const min = group.get('minAmount')?.value;
    const max = group.get('maxAmount')?.value;
    
    if (min != null && max != null && Number(min) > Number(max)) {
      return { amountRange: true };
    }
    return null;
  }
  
  private dateRangeValidator(group: any) {
    const start: Date | null = group.get('startDate')?.value;
    const end: Date | null = group.get('endDate')?.value;
    
    if (start && end && start.getTime() > end.getTime()) {
      return { dateRange: true };
    }
    return null;
  }
}
