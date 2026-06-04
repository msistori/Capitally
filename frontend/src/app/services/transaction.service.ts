import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import {
  TransactionModel
} from '../models/transaction.model';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly apiUrl = '/transaction';

  constructor(private http: HttpClient) {}

  getTransactions(accountId?: number): Observable<TransactionModel[]> {
    let params = new HttpParams();

    if (accountId !== undefined) {
      params = params.set('accountId', accountId);
    }

    return this.http.get<TransactionModel[]>(`${this.apiUrl}`, { params });
  }

  postTransaction(transaction: TransactionModel): Observable<TransactionModel> {
    const { userId, ...payload } = transaction;
    return this.http.post<TransactionModel>(`${this.apiUrl}`, payload);
  }

  putTransaction(transactionId: number, transaction: TransactionModel): Observable<TransactionModel> {
    const { userId, ...payload } = transaction;
    return this.http.put<TransactionModel>(`${this.apiUrl}/${transactionId}`, payload);
  }

  deleteTransaction(transactionId?: number) {
    let params = new HttpParams();

    if (transactionId !== undefined) {
      params = params.set('transactionId', transactionId);
    } else return EMPTY;

    return this.http.delete<void>(`${this.apiUrl}`, { params });
  }

  deleteTransactions(accountId?: number) {
    let params = new HttpParams();

    if (accountId !== undefined) {
      params = params.set('accountId', accountId);
    }

    return this.http.delete<void>(`${this.apiUrl}`, { params });
  }
}
