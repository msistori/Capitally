import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ImportExportTransactionsModel, ImportResponseHelper } from 'src/app/models/import-export-transactions.model';
import { ImportExportTransactionsService } from 'src/app/services/import-export-transactions.service';
import { ImportCsvDialogComponent } from '../import-csv-dialog/import-csv-dialog.component';
import { ImportResultDialogComponent } from '../import-result-dialog/import-result-dialog.component';
import { RefreshService } from 'src/app/services/refresh.service';
import { ExportCsvDialogComponent } from '../export-csv-dialog/export-csv-dialog.component';
import { TemplateCsvDialogComponent } from '../template-csv-dialog/template-csv-dialog.component';

@Component({
  selector: 'app-import-export-transactions',
  templateUrl: './import-export-transactions.component.html',
  styleUrls: ['./import-export-transactions.component.scss']
})
export class ImportExportTransactionsComponent {
  @Input() parentDialogRef?: MatDialogRef<any>;

  constructor(
    private dialog: MatDialog,
    private importExportTransactionsService: ImportExportTransactionsService,
    private refreshService: RefreshService
  ) { }

  openTemplateDialog(): void {
    const dialogRef = this.dialog.open(TemplateCsvDialogComponent, {
      width: '400px',
      maxWidth: 'calc(100vw - 2rem)',
      panelClass: 'template-csv-dialog',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((file: File) => {
    });
  }

  openImportDialog(): void {
    const dialogRef = this.dialog.open(ImportCsvDialogComponent, {
      width: '400px',
      maxWidth: 'calc(100vw - 2rem)',
      panelClass: 'import-csv-dialog',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((file: File) => {
      if (file) {
        this.importCsv(file);
      }
    });
  }

  openExportDialog(): void {
    const dialogRef = this.dialog.open(ExportCsvDialogComponent, {
      width: '640px',
      maxWidth: 'calc(100vw - 2rem)',
      panelClass: 'export-csv-dialog',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((file: File) => {
    });
  }

  private importCsv(file: File): void {
    this.importExportTransactionsService.postImportTransactions(file).subscribe({
      next: (response) => {
        if (ImportResponseHelper.isSuccess(response)) {
          this.showImportResults(response);
        } else {
          this.showImportErrors(response);
        }
      },
      error: () => {
      }
    });
  }

  private showImportResults(response: ImportExportTransactionsModel): void {
    const dialogRef = this.dialog.open(ImportResultDialogComponent, {
      width: '600px',
      maxWidth: 'calc(100vw - 2rem)',
      panelClass: 'import-result-dialog',
      disableClose: false,
      data: {
        summary: response.summary,
        hasErrors: ImportResponseHelper.hasErrors(response),
        errors: response.errors,
        failed: false
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.refreshService.triggerRefresh();

      if (this.parentDialogRef) {
        this.parentDialogRef.close();
      }
    });
  }

  private showImportErrors(response: ImportExportTransactionsModel): void {
    const dialogRef = this.dialog.open(ImportResultDialogComponent, {
      width: '600px',
      maxWidth: 'calc(100vw - 2rem)',
      panelClass: 'import-result-dialog',
      disableClose: false,
      data: {
        summary: response.summary,
        hasErrors: true,
        errors: response.errors,
        failed: true
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.refreshService.triggerRefresh();

      if (this.parentDialogRef) {
        this.parentDialogRef.close();
      }
    });
  }
}
