import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { SettingsModalComponent } from './settings-modal/settings-modal.component';
import { ImportExportTransactionsComponent } from './../../components/import-export/import-export-transactions/import-export-transactions.component';
import { ImportCsvDialogComponent } from './../../components/import-export/import-csv-dialog/import-csv-dialog.component';
import { ImportResultDialogComponent } from './../../components/import-export/import-result-dialog/import-result-dialog.component';
import { ExportCsvDialogComponent } from './../../components/import-export/export-csv-dialog/export-csv-dialog.component';
import { TemplateCsvDialogComponent } from 'src/app/components/import-export/template-csv-dialog/template-csv-dialog.component';

@NgModule({
  declarations: [
    SettingsModalComponent,
    ImportExportTransactionsComponent,
    ImportCsvDialogComponent,
    ImportResultDialogComponent,
    ExportCsvDialogComponent,
    TemplateCsvDialogComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,

    MatDialogModule,
    MatButtonModule,
    MatIconModule,

    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,

    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class SettingsModule {}