import { Component } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-import-csv-dialog',
  templateUrl: './import-csv-dialog.component.html',
  styleUrls: ['./import-csv-dialog.component.scss']
})
export class ImportCsvDialogComponent {
  selectedFile: File | null = null;
  error: string = '';

  constructor(
    public dialogRef: MatDialogRef<ImportCsvDialogComponent>,
    private translateService: TranslateService
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.validateAndSetFile(file);
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
      this.validateAndSetFile(file);
    }
  }

  validateAndSetFile(file: File): void {
    this.error = '';
    
    if (!file.name.endsWith('.csv')) {
      this.error = this.translateService.instant('SETTINGS.IMPORT_EXPORT.IMPORT.FORMAT_ERROR') as string;
      return;
    }
    
    this.selectedFile = file;
  }

  onConfirm(): void {
    if (this.selectedFile) {
      this.dialogRef.close(this.selectedFile);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
