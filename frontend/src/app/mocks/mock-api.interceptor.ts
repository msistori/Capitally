import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { accountsMock } from './accounts.mock';
import {
  accountLoginResponse,
  accountMeResponse,
  guestLoginResponse,
  guestMeResponse,
  MOCK_AUTH_STORAGE_KEY,
  MockAuthProfile
} from './auth.mock';
import { categoriesMock } from './categories.mock';
import { currenciesMock } from './currencies.mock';
import {
  balanceTrendMock,
  dashboardOverviewMock,
  incomeExpenseBreakdownMock
} from './dashboard.mock';
import { importTransactionsMock } from './import-export.mock';
import { MockApiConfig, MockEndpointKey } from './mock-api.types';
import { transactionsMock } from './transactions.mock';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const config = (environment as any).mockApi as MockApiConfig | undefined;

    if (!config?.enabled) {
      return next.handle(req);
    }

    const response = this.getMockResponse(req, config);
    return response ? of(response) : next.handle(req);
  }

  private getMockResponse(req: HttpRequest<any>, config: MockApiConfig): HttpResponse<any> | null {
    const path = this.getPathname(req.urlWithParams);

    if (req.method === 'POST' && path === '/auth/login' && this.isEndpointEnabled(config, 'authLogin')) {
      return this.json(this.login(req.body));
    }

    if (req.method === 'GET' && path === '/auth/me' && this.isEndpointEnabled(config, 'authMe')) {
      return this.json(this.me());
    }

    if (req.method === 'GET' && path === '/dashboard/overview' && this.isEndpointEnabled(config, 'dashboardOverview')) {
      return this.json(dashboardOverviewMock);
    }

    if (req.method === 'GET' && path === '/dashboard/balance-trend' && this.isEndpointEnabled(config, 'dashboardBalanceTrend')) {
      return this.json(balanceTrendMock);
    }

    if (req.method === 'GET' && path === '/dashboard/income-expense-breakdown' && this.isEndpointEnabled(config, 'dashboardIncomeExpenseBreakdown')) {
      return this.json(incomeExpenseBreakdownMock);
    }

    if (path === '/transaction' && this.isEndpointEnabled(config, 'transactions')) {
      return this.handleTransactions(req);
    }

    if (path.startsWith('/category') && this.isEndpointEnabled(config, 'categories')) {
      return this.handleCategories(req);
    }

    if (path === '/account' && this.isEndpointEnabled(config, 'accounts')) {
      return this.handleAccounts(req);
    }

    if (req.method === 'GET' && path === '/currency' && this.isEndpointEnabled(config, 'currencies')) {
      return this.json(currenciesMock);
    }

    if (path.startsWith('/transactions') && this.isEndpointEnabled(config, 'importExport')) {
      return this.handleImportExport(req, path);
    }

    return null;
  }

  private login(body: any) {
    const profile: MockAuthProfile = String(body?.usernameOrEmail ?? '').toLowerCase() === 'demo'
      ? 'guest'
      : 'account';

    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, profile);
    return profile === 'guest' ? guestLoginResponse : accountLoginResponse;
  }

  private me() {
    const profile = localStorage.getItem(MOCK_AUTH_STORAGE_KEY) as MockAuthProfile | null;
    return profile === 'account' ? accountMeResponse : guestMeResponse;
  }

  private handleTransactions(req: HttpRequest<any>): HttpResponse<any> | null {
    if (req.method === 'GET') {
      return this.json(transactionsMock);
    }

    if (req.method === 'POST') {
      return this.json({ id: Date.now(), ...req.body });
    }

    if (req.method === 'DELETE') {
      return this.json(null);
    }

    return null;
  }

  private handleCategories(req: HttpRequest<any>): HttpResponse<any> | null {
    if (req.method === 'GET') {
      return this.json(categoriesMock);
    }

    if (req.method === 'POST') {
      return this.json({ id: Date.now(), ...req.body });
    }

    if (req.method === 'PUT') {
      return this.json(req.body);
    }

    if (req.method === 'DELETE') {
      return this.json(null);
    }

    return null;
  }

  private handleAccounts(req: HttpRequest<any>): HttpResponse<any> | null {
    if (req.method === 'GET') {
      return this.json(accountsMock);
    }

    if (req.method === 'POST') {
      return this.json({ id: Date.now(), ...req.body });
    }

    if (req.method === 'DELETE') {
      return this.json(null);
    }

    return null;
  }

  private handleImportExport(req: HttpRequest<any>, path: string): HttpResponse<any> | null {
    if (req.method === 'POST' && path === '/transactions/import') {
      return this.json(importTransactionsMock);
    }

    if (req.method === 'GET' && (path === '/transactions/template' || path === '/transactions/export')) {
      const csv = 'date,description,amount,currencyCode,transactionType,account,macroCategory,category\n';
      return new HttpResponse({
        status: 200,
        body: new Blob([csv], { type: 'text/csv' }),
        headers: req.headers
      });
    }

    return null;
  }

  private isEndpointEnabled(config: MockApiConfig, endpoint: MockEndpointKey): boolean {
    return config.endpoints?.[endpoint] === true;
  }

  private getPathname(url: string): string {
    return new URL(url, window.location.origin).pathname;
  }

  private json(body: any): HttpResponse<any> {
    return new HttpResponse({ status: 200, body });
  }
}
