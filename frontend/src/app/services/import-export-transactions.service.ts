import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { ImportExportTransactionsModel, TransactionExportFilterInputDTO } from '../models/import-export-transactions.model';

@Injectable({ providedIn: 'root' })
export class ImportExportTransactionsService {
  private readonly apiUrl = '/transactions';

  constructor(private http: HttpClient) {}

  getTemplateTransactions(): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/template`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  postImportTransactions(file: File): Observable<ImportExportTransactionsModel> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ImportExportTransactionsModel>(`${this.apiUrl}/import`, formData);
  }

  getExportTransactions(filter?: TransactionExportFilterInputDTO): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob',
      observe: 'response'
    });
  }
}
