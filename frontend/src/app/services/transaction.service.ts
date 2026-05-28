import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  TransactionModel
} from '../models/transaction.model';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly apiUrl = '/transaction';

  constructor(private http: HttpClient) {}

  getTransactions(userId: string, accountId?: number): Observable<TransactionModel[]> {
    let params = new HttpParams().set('userId', userId);

    if (accountId !== undefined) {
      params = params.set('accountId', accountId);
    }

    return this.http.get<TransactionModel[]>(`${this.apiUrl}`, { params });
  }

  postTransaction(transaction: TransactionModel): Observable<TransactionModel> {
    return this.http.post<TransactionModel>(`${this.apiUrl}`, transaction);
  }

  putTransaction(transactionId: number, transaction: TransactionModel): Observable<TransactionModel> {
    return this.http.put<TransactionModel>(`${this.apiUrl}/${transactionId}`, transaction);
  }

  deleteTransactions(accountId?: number) {
    let params = new HttpParams();

    if (accountId !== undefined) {
      params = params.set('accountId', accountId);
    }

    return this.http.delete<void>(`${this.apiUrl}`, { params });
  }
}
