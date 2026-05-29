import { HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/internal/operators/finalize';
import { ImportExportCsvType } from 'src/app/models/import-export-transactions.model';
import { ImportExportTransactionsService } from 'src/app/services/import-export-transactions.service';

@Component({
  selector: 'app-template-csv-dialog',
  templateUrl: './template-csv-dialog.component.html',
  styleUrls: ['./template-csv-dialog.component.scss']
})
export class TemplateCsvDialogComponent {
  downloading = false;
  downloadingType: ImportExportCsvType | null = null;
  readonly templateTypes: ImportExportCsvType[] = ['transactions', 'transfers', 'accounts'];
  
  constructor(
    private dialogRef: MatDialogRef<TemplateCsvDialogComponent>,
    private txService: ImportExportTransactionsService
  ) {}
  
  close(): void {
    this.dialogRef.close(false);
  }
  
  download(type: ImportExportCsvType): void {
    if (this.downloading) return;
    
    this.downloading = true;
    this.downloadingType = type;
    this.txService
    .getTemplateTransactions(type)
    .pipe(finalize(() => {
      this.downloading = false;
      this.downloadingType = null;
    }))
    .subscribe({
      next: (res: HttpResponse<Blob>) => this.handleDownload(res, type),
      error: () => {
      }
    });
  }
  
  private handleDownload(res: HttpResponse<Blob>, type: ImportExportCsvType): void {
    const blob = res.body;
    if (!blob) return;
    
    const filename =
    this.extractFilename(res.headers.get('content-disposition')) ??
    this.defaultFilename(type);
    
    this.downloadBlob(blob, filename);
  }
  
  private extractFilename(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;
    
    const m1 = /filename="([^"]+)"/.exec(contentDisposition);
    if (m1?.[1]) return m1[1];
    
    const m2 = /filename\*\=UTF-8''([^;]+)/.exec(contentDisposition);
    if (m2?.[1]) return decodeURIComponent(m2[1]);
    
    return null;
  }
  
  private defaultFilename(type: ImportExportCsvType): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `template_${type}_${yyyy}-${mm}-${dd}.csv`;
  }
  
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

