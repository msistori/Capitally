import { Component, Input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ImportExportTransactionsModel, ImportResponseHelper, ImportResult } from 'src/app/models/import-export-transactions.model';
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
    private refreshService: RefreshService,
    private translateService: TranslateService
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
      error: (error: HttpErrorResponse) => {
        const importError = this.getImportErrorResponse(error);
        importError ? this.showImportErrors(importError) : this.showGenericImportError();
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
        errors: response.errors?.length ? response.errors : [this.getGenericImportError()],
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

  private showGenericImportError(): void {
    this.showImportErrors({
      result: ImportResult.FAILED,
      summary: {
        totalRows: 0,
        importedTransactions: 0,
        newAccounts: [],
        newCategories: {}
      },
      errors: [this.getGenericImportError()]
    });
  }

  private getImportErrorResponse(error: HttpErrorResponse): ImportExportTransactionsModel | null {
    if (error.error && typeof error.error === 'object' && 'result' in error.error) {
      return error.error as ImportExportTransactionsModel;
    }

    const message = this.getErrorMessage(error);
    if (!message) return null;

    return {
      result: ImportResult.FAILED,
      summary: {
        totalRows: 0,
        importedTransactions: 0,
        newAccounts: [],
        newCategories: {}
      },
      errors: [{ message }]
    };
  }

  private getErrorMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.message) {
      return error.message;
    }

    return null;
  }

  private getGenericImportError(): { message: string } {
    return {
      message: this.translateService.instant('SETTINGS.IMPORT_EXPORT.IMPORT.GENERIC_ERROR') as string
    };
  }
}
