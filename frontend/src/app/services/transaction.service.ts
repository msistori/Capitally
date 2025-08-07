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

  getTransactions(userId: string): Observable<TransactionModel[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<TransactionModel[]>(`${this.apiUrl}`, { params });
  }

  postTransaction(transaction: TransactionModel): Observable<TransactionModel> {
    return this.http.post<TransactionModel>(`${this.apiUrl}`, transaction);
  }
}
