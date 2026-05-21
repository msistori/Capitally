import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TransferModel, TransferRequestModel } from '../models/transfer.model';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private readonly apiUrl = `${environment.apiBase ?? ''}/transfer`;

  constructor(private http: HttpClient) {}

  getTransfers(userId: string, startDate?: string, endDate?: string): Observable<TransferModel[]> {
    let params = new HttpParams().set('userId', userId);

    if (startDate) {
      params = params.set('startDate', startDate);
    }

    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<TransferModel[]>(`${this.apiUrl}`, { params });
  }

  postTransfer(transfer: TransferRequestModel): Observable<TransferModel> {
    return this.http.post<TransferModel>(`${this.apiUrl}`, transfer);
  }
}
