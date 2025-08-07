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

  postAccount(account: AccountModel): Observable<AccountModel> {
    //return this.http.post<TransactionModel>(`${this.apiUrl}`, transaction);
    console.log(account);
    return new Observable<AccountModel>;
  }
}
