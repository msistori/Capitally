import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { NgChartsModule } from 'ng2-charts';
import { TranslateModule } from '@ngx-translate/core';

import { UpcomingRecurringComponent } from '../../components/upcoming-recurring/upcoming-recurring.component';
import { SummaryComponent } from './summary.component';

@NgModule({
  declarations: [
    UpcomingRecurringComponent,
    SummaryComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSelectModule,
    NgChartsModule,
    TranslateModule
  ]
})
export class SummaryModule {}
