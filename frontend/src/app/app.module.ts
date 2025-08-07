import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

/* Material / terze parti */
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

/* Componenti tuoi */
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BalanceSummaryComponent } from './components/balance-summary/balance-summary.component';
import { RecentTransactionsComponent } from './components/recent-transactions/recent-transactions.component';
import { MonthlySummaryComponent } from './components/monthly-summary/monthly-summary.component';
import { TransactionsModule } from './components/insert-transaction/transactions.module';
import { MAT_RIPPLE_GLOBAL_OPTIONS, RippleGlobalOptions } from '@angular/material/core';

const globalRippleConfig: RippleGlobalOptions = { disabled: true };

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    DashboardComponent,
    BalanceSummaryComponent,
    RecentTransactionsComponent,
    MonthlySummaryComponent,
    FooterComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    TranslateModule.forRoot({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      })
    }),
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    /* Material */
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    /* Third-party */
    NgChartsModule,
    /* Feature modules */
    TransactionsModule
  ],
  providers: [
    { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: globalRippleConfig }],
  bootstrap: [AppComponent]
})
export class AppModule {}
