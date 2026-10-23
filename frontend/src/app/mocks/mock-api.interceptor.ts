import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

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
import { upcomingRecurringMock } from './dashboard.mock';
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

    const path = this.getPathname(req.urlWithParams);
    if (req.method === 'POST' && this.isEndpointEnabled(config, 'authLogin')) {
      if (path === '/auth/logout') {
        localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
        return of(this.json(null));
      }
      if (path === '/auth/refresh') {
        return localStorage.getItem(MOCK_AUTH_STORAGE_KEY) === 'account'
          ? of(this.json(accountLoginResponse))
          : throwError(() => new HttpErrorResponse({ status: 401 }));
      }
    }
    const response = this.getMockResponse(req, config);
    return response ? of(response) : next.handle(req);
  }

  private getMockResponse(req: HttpRequest<any>, config: MockApiConfig): HttpResponse<any> | null {
    const path = this.getPathname(req.urlWithParams);

    if (req.method === 'POST' && path === '/auth/login' && this.isEndpointEnabled(config, 'authLogin')) {
      return this.json(this.login(req.body));
    }

    if (req.method === 'POST' && path === '/auth/guest-login' && this.isEndpointEnabled(config, 'authLogin')) {
      return this.json(this.guestLogin());
    }

    if (req.method === 'POST' && path === '/auth/forgot-password' && this.isEndpointEnabled(config, 'authLogin')) {
      return this.json(null);
    }

    if (req.method === 'GET' && path === '/auth/me' && this.isEndpointEnabled(config, 'authMe')) {
      return this.json(this.me());
    }

    if (req.method === 'PUT'
      && (path === '/users/me/password' || path === '/api/users/me/password')
      && this.isEndpointEnabled(config, 'authMe')) {
      return this.json(null);
    }

    if (req.method === 'GET' && path === '/dashboard/upcoming-recurring' && this.isEndpointEnabled(config, 'dashboardUpcomingRecurring')) {
      return this.json(upcomingRecurringMock);
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

    if ((path === '/transfer' || path === '/api/transfer' || path.startsWith('/transfer/') || path.startsWith('/api/transfer/')) && this.isEndpointEnabled(config, 'transfers')) {
      return this.handleTransfers(req, path);
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

  private guestLogin() {
    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, 'guest');
    return guestLoginResponse;
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

      if (path === '/transaction/recent') {
        const page = Math.max(0, Number(req.params.get('page')) || 0);
        const recent = transactions.filter(transaction => {
          const item = transaction as any;
          return !item.transferCounterpartyAccountId && !item.transferGroupId?.trim().startsWith('TRF-');
        }).sort((a, b) => String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id));
        const start = page * 10;
        return this.json({ content: recent.slice(start, start + 10), last: start + 10 >= recent.length });
      }

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

  private handleTransfers(req: HttpRequest<any>, path: string): HttpResponse<any> | null {
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

    if (req.method === 'PUT') {
      const transferGroupId = decodeURIComponent(path.split('/').pop() ?? '');
      const index = transfersMock.findIndex(transfer => transfer.transferGroupId === transferGroupId);
      const source = accountsMock.find(account => account.id === Number(req.body?.sourceAccountId));
      const destination = accountsMock.find(account => account.id === Number(req.body?.destinationAccountId));
      const updated = {
        ...(transfersMock[index] ?? { transferGroupId }),
        ...req.body,
        transferGroupId,
        sourceAccountName: source?.name ?? '',
        sourceAccountIconName: source?.iconName ?? 'account_balance_wallet',
        destinationAccountName: destination?.name ?? '',
        destinationAccountIconName: destination?.iconName ?? 'account_balance_wallet'
      };

      if (index >= 0) {
        transfersMock[index] = updated;
      }

      return this.json(updated);
    }

    if (req.method === 'DELETE') {
      const transferGroupId = decodeURIComponent(path.split('/').pop() ?? '');
      const index = transfersMock.findIndex(transfer => transfer.transferGroupId === transferGroupId);

      if (index >= 0) {
        transfersMock.splice(index, 1);
      }

      return this.json(null);
    }

    return null;
  }

  private handleImportExport(req: HttpRequest<any>, path: string): HttpResponse<any> | null {
    if (req.method === 'POST' && path.startsWith('/transactions/import')) {
      const type = path.endsWith('/accounts') ? 'accounts' : path.endsWith('/transfers') ? 'transfers' : 'transactions';
      return this.json({
        ...importTransactionsMock,
        summary: {
          ...importTransactionsMock.summary,
          importedTransactions: type === 'transactions' ? 1 : 0,
          importedTransfers: type === 'transfers' ? 1 : 0,
          importedAccounts: type === 'accounts' ? 1 : 0,
          totalRows: 1
        }
      });
    }

    if (req.method === 'GET' && path.startsWith('/transactions/template')) {
      const csv = this.mockImportExportCsv(path, true);
      return new HttpResponse({
        status: 200,
        body: new Blob([csv], { type: 'text/csv' }),
        headers: req.headers
      });
    }

    if (req.method === 'GET' && path.startsWith('/transactions/export')) {
      const csv = this.mockImportExportCsv(path, false);
      return new HttpResponse({
        status: 200,
        body: new Blob([csv], { type: 'text/csv' }),
        headers: req.headers
      });
    }

    return null;
  }

  private mockImportExportCsv(path: string, template: boolean): string {
    if (path.endsWith('/accounts')) {
      return 'account_name;currency;initial_balance;final_balance;include_in_total_balance;icon_name\n';
    }

    if (path.endsWith('/transfers')) {
      return 'date;source_account;destination_account;amount;currency;description\n';
    }

    const header = 'date;macrocategory;category;account_name;amount;currency;description;transaction_type;is_recurring;recurrence_period;recurrence_end_date\n';
    return template ? header : `${header}`;
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
