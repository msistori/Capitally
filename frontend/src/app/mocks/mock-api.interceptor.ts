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
  annualIncomeExpenseMock,
  balanceTrendMock,
  dashboardOverviewMock,
  incomeExpenseBreakdownMock
} from './dashboard.mock';
import { importTransactionsMock } from './import-export.mock';
import { MockApiConfig, MockEndpointKey } from './mock-api.types';
import { transactionsMock } from './transactions.mock';
import { transfersMock } from './transfers.mock';

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

    if (req.method === 'GET' && path === '/dashboard/annual-income-expense' && this.isEndpointEnabled(config, 'dashboardAnnualIncomeExpense')) {
      return this.json(annualIncomeExpenseMock);
    }

    if ((path === '/transaction' || path.startsWith('/transaction/')) && this.isEndpointEnabled(config, 'transactions')) {
      return this.handleTransactions(req, path);
    }

    if (path.startsWith('/category') && this.isEndpointEnabled(config, 'categories')) {
      return this.handleCategories(req);
    }

    if ((path === '/account' || path.startsWith('/account/')) && this.isEndpointEnabled(config, 'accounts')) {
      return this.handleAccounts(req, path);
    }

    if ((path === '/transfer' || path === '/api/transfer') && this.isEndpointEnabled(config, 'transfers')) {
      return this.handleTransfers(req);
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

  private handleTransactions(req: HttpRequest<any>, path: string): HttpResponse<any> | null {
    if (req.method === 'GET') {
      const userId = Number(req.params.get('userId'));
      const accountId = Number(req.params.get('accountId'));
      const transactions = transactionsMock.filter(transaction => {
        const item = transaction as any;
        const matchesUser = !userId || Number(transaction.userId) === userId;
        const matchesAccount = !accountId
          || Number(item.accountId) === accountId
          || Number(item.transferCounterpartyAccountId) === accountId;
        return matchesUser && matchesAccount;
      });

      return this.json(transactions);
    }

    if (req.method === 'POST') {
      const transaction = { id: Date.now(), ...req.body };
      transactionsMock.unshift(transaction);
      return this.json(transaction);
    }

    if (req.method === 'PUT') {
      const id = Number(path.split('/').pop());
      const index = transactionsMock.findIndex(transaction => Number((transaction as any).id) === id);
      const updated = { ...(transactionsMock[index] ?? { id }), ...req.body, id };

      if (index >= 0) {
        transactionsMock[index] = updated;
      }

      return this.json(updated);
    }

    if (req.method === 'DELETE') {
      const accountId = Number(req.params.get('accountId'));

      for (let index = transactionsMock.length - 1; index >= 0; index--) {
        const transaction = transactionsMock[index] as any;

        if (!accountId
          || Number(transaction.accountId) === accountId
          || Number(transaction.transferCounterpartyAccountId) === accountId) {
          transactionsMock.splice(index, 1);
        }
      }

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

  private handleAccounts(req: HttpRequest<any>, path: string): HttpResponse<any> | null {
    if (req.method === 'GET') {
      return this.json(accountsMock);
    }

    if (req.method === 'POST') {
      const account = { id: Date.now(), ...req.body };
      accountsMock.push(account);
      return this.json(account);
    }

    if (req.method === 'PUT') {
      const id = Number(path.split('/').pop());
      const index = accountsMock.findIndex(account => account.id === id);
      const updated = { ...(accountsMock[index] ?? { id }), ...req.body, id };

      if (index >= 0) {
        accountsMock[index] = updated;
      }

      return this.json(updated);
    }

    if (req.method === 'DELETE') {
      const accountId = Number(req.params.get('accountId'));
      const index = accountsMock.findIndex(account => account.id === accountId);

      if (index >= 0) {
        accountsMock.splice(index, 1);
      }

      return this.json(null);
    }

    return null;
  }

  private handleTransfers(req: HttpRequest<any>): HttpResponse<any> | null {
    if (req.method === 'GET') {
      return this.json(transfersMock);
    }

    if (req.method === 'POST') {
      const source = accountsMock.find(account => account.id === Number(req.body?.sourceAccountId));
      const destination = accountsMock.find(account => account.id === Number(req.body?.destinationAccountId));

      return this.json({
        transferGroupId: `mock-transfer-${Date.now()}`,
        sourceTransactionId: Date.now(),
        destinationTransactionId: Date.now() + 1,
        sourceAccountName: source?.name ?? '',
        sourceAccountIconName: source?.iconName ?? 'account_balance_wallet',
        destinationAccountName: destination?.name ?? '',
        destinationAccountIconName: destination?.iconName ?? 'account_balance_wallet',
        ...req.body
      });
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
