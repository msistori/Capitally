import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './auth/auth.guard';
import { AccountsComponent } from './pages/accounts/accounts.component';
import { SummaryComponent } from './pages/summary/summary.component';
import { LegalPageComponent } from './pages/legal/legal-page.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { InstallAppComponent } from './pages/install-app/install-app.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

const routes: Routes = [
  { path: '', redirectTo: 'it', pathMatch: 'full' },
  { path: 'it', component: WelcomeComponent, pathMatch: 'full', data: { lang: 'it', seoKey: 'home', indexable: true } },
  { path: 'en', component: WelcomeComponent, pathMatch: 'full', data: { lang: 'en', seoKey: 'home', indexable: true } },
  { path: 'it/login', component: LoginComponent, data: { lang: 'it', seoKey: 'login', robots: 'noindex,nofollow' } },
  { path: 'en/login', component: LoginComponent, data: { lang: 'en', seoKey: 'login', robots: 'noindex,nofollow' } },
  { path: 'it/registrazione', component: LoginComponent, data: { lang: 'it', seoKey: 'register', robots: 'noindex,nofollow', authMode: 'register' } },
  { path: 'en/register', component: LoginComponent, data: { lang: 'en', seoKey: 'register', robots: 'noindex,nofollow', authMode: 'register' } },
  { path: 'it/termini-condizioni', component: LegalPageComponent, data: { lang: 'it', document: 'terms', seoKey: 'legal.terms', indexable: true } },
  { path: 'en/terms-and-conditions', component: LegalPageComponent, data: { lang: 'en', document: 'terms', seoKey: 'legal.terms', indexable: true } },
  { path: 'it/privacy', component: LegalPageComponent, data: { lang: 'it', document: 'privacy', seoKey: 'legal.privacy', indexable: true } },
  { path: 'en/privacy', component: LegalPageComponent, data: { lang: 'en', document: 'privacy', seoKey: 'legal.privacy', indexable: true } },
  { path: 'it/cookie-policy', component: LegalPageComponent, data: { lang: 'it', document: 'cookies', seoKey: 'legal.cookies', indexable: true } },
  { path: 'en/cookie-policy', component: LegalPageComponent, data: { lang: 'en', document: 'cookies', seoKey: 'legal.cookies', indexable: true } },
  { path: 'it/installazione-app', component: InstallAppComponent, data: { lang: 'it', seoKey: 'install', indexable: true } },
  { path: 'en/install-app', component: InstallAppComponent, data: { lang: 'en', seoKey: 'install', indexable: true } },
  { path: 'it/404', component: NotFoundComponent, data: { lang: 'it', seoKey: 'notFound', robots: 'noindex,nofollow' } },
  { path: 'en/404', component: NotFoundComponent, data: { lang: 'en', seoKey: 'notFound', robots: 'noindex,nofollow' } },

  { path: 'app/dashboard', component: DashboardComponent, canActivate: [authGuard], data: { seoKey: 'private', robots: 'noindex,nofollow' } },
  { path: 'app/accounts', component: AccountsComponent, canActivate: [authGuard], data: { seoKey: 'private', robots: 'noindex,nofollow' } },
  { path: 'app/summary', component: SummaryComponent, canActivate: [authGuard], data: { seoKey: 'private', robots: 'noindex,nofollow' } },

  { path: 'login', redirectTo: 'it/login', pathMatch: 'full' },
  { path: 'register', redirectTo: 'en/register', pathMatch: 'full' },
  { path: 'legal', redirectTo: 'it/termini-condizioni', pathMatch: 'full' },
  { path: 'legal/terms', redirectTo: 'it/termini-condizioni', pathMatch: 'full' },
  { path: 'legal/privacy', redirectTo: 'it/privacy', pathMatch: 'full' },
  { path: 'legal/cookies', redirectTo: 'it/cookie-policy', pathMatch: 'full' },
  { path: 'dashboard', redirectTo: 'app/dashboard', pathMatch: 'full' },
  { path: 'accounts', redirectTo: 'app/accounts', pathMatch: 'full' },
  { path: 'summary', redirectTo: 'app/summary', pathMatch: 'full' },
  { path: '**', redirectTo: 'it/404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
