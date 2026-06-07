import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DuplicateCategoryData {
  macroCategory: string;
  category: string;
}

@Component({
  selector: 'app-duplicate-category-alert',
  templateUrl: './duplicate-category-alert.component.html',
  styleUrls: ['./duplicate-category-alert.component.scss']
})
export class DuplicateCategoryAlertComponent {
  constructor(
    public dialogRef: MatDialogRef<DuplicateCategoryAlertComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DuplicateCategoryData
  ) {}

  close(): void {
    this.dialogRef.close('close');
  }

  modify(): void {
    this.dialogRef.close('modify');
  }
}
