import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AccountModel
} from '../models/account.model';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly apiUrl = '/account';

  constructor(private http: HttpClient) {}

  getAccounts(userId: string): Observable<AccountModel[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<AccountModel[]>(`${this.apiUrl}`, { params });
  }

  postAccount(account: Partial<AccountModel>): Observable<AccountModel> {
    return this.http.post<AccountModel>(`${this.apiUrl}`, account);
  }

  putAccount(accountId: number, account: Partial<AccountModel>): Observable<AccountModel> {
    return this.http.put<AccountModel>(`${this.apiUrl}/${accountId}`, account);
  }

  deleteAccounts() {
    return this.http.delete<void>(`${this.apiUrl}`);
  }

  deleteAccount(accountId: number): Observable<void> {
    const params = new HttpParams().set('accountId', accountId);
    return this.http.delete<void>(`${this.apiUrl}`, { params });
  }
}
