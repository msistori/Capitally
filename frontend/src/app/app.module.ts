import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClientXsrfModule } from '@angular/common/http';
import { AuthInterceptor } from './auth/auth.interceptor';

import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

/* Material / third parts */
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { MatDialogModule } from '@angular/material/dialog';

/* Components */
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BalanceSummaryComponent } from './components/balance-summary/balance-summary.component';
import { RecentTransactionsComponent } from './components/recent-transactions/recent-transactions.component';
import { MonthlySummaryComponent } from './components/monthly-summary/monthly-summary.component';
import { AnnualIncomeExpenseComponent } from './components/annual-income-expense/annual-income-expense.component';
import { TransactionsModule } from './components/insert-transaction/transactions.module';
import { DuplicateCategoryAlertComponent } from './alerts/duplicate-category-alert/duplicate-category-alert.component';
import { BalanceTrendComponent } from './components/balance-trend/balance-trend.component';

import { MAT_RIPPLE_GLOBAL_OPTIONS, RippleGlobalOptions } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';

import localeIt from '@angular/common/locales/it';
import localeEn from '@angular/common/locales/en';

import { LoadingInterceptor } from './loader/loading.interceptor';
import { LoadingOverlayComponent } from './loader/loading-overlay/loading-overlay.component';
import { IncomeExpenseBreakdownComponent } from './components/income-expense-breakdown/income-expense-breakdown.component';
import { FooterActionComponent } from './components/navbar/footer-action/footer-action.component';
import { SettingsModule } from './pages/settings/settings.module';
import { GuestInterceptor } from './interceptors/guest.interceptor';
import { MockApiInterceptor } from './mocks/mock-api.interceptor';
import { GuestRestrictionDialogComponent } from './components/guest-restriction-dialog/guest-restriction-dialog.component';
import { AccountsModule } from './pages/accounts/accounts.module';
import { SummaryModule } from './pages/summary/summary.module';
import { AnalyticsConsentInterceptor } from './analytics/analytics-consent.interceptor';
import { CookieConsentComponent } from './components/cookie-consent/cookie-consent.component';

registerLocaleData(localeIt);
registerLocaleData(localeEn);

const globalRippleConfig: RippleGlobalOptions = { disabled: true };

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    DashboardComponent,
    BalanceSummaryComponent,
    RecentTransactionsComponent,
    MonthlySummaryComponent,
    AnnualIncomeExpenseComponent,
    DuplicateCategoryAlertComponent,
    BalanceTrendComponent,
    IncomeExpenseBreakdownComponent,
    NavbarComponent,
    FooterComponent,
    FooterActionComponent,
    GuestRestrictionDialogComponent,
    CookieConsentComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN'
    }),
    TranslateModule.forRoot({
      fallbackLang: 'it',
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      })
    }),
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    NgChartsModule,
    TransactionsModule,
    SettingsModule,
    AccountsModule,
    SummaryModule,
    MatDialogModule,
    LoadingOverlayComponent
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AnalyticsConsentInterceptor, multi: true },
    { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: globalRippleConfig },
    { provide: LOCALE_ID, useValue: 'it-IT' },
    { provide: HTTP_INTERCEPTORS, useClass: GuestInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: MockApiInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
