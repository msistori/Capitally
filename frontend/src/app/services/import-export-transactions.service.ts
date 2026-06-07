import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { ImportExportCsvType, ImportExportTransactionsModel, TransactionExportFilterInputDTO } from '../models/import-export-transactions.model';

@Injectable({ providedIn: 'root' })
export class ImportExportTransactionsService {
  private readonly apiUrl = '/transactions';

  constructor(private http: HttpClient) {}

  getTemplateTransactions(type: ImportExportCsvType = 'transactions'): Observable<HttpResponse<Blob>> {
    return this.http.get(this.templateUrl(type), {
      responseType: 'blob',
      observe: 'response'
    });
  }

  postImportTransactions(file: File, type: ImportExportCsvType = 'transactions'): Observable<ImportExportTransactionsModel> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ImportExportTransactionsModel>(this.importUrl(type), formData);
  }

  getExportTransactions(filter?: TransactionExportFilterInputDTO, type: ImportExportCsvType = 'transactions'): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get(this.exportUrl(type), {
      params,
      responseType: 'blob',
      observe: 'response'
    });
  }

  private templateUrl(type: ImportExportCsvType): string {
    return type === 'transactions' ? `${this.apiUrl}/template` : `${this.apiUrl}/template/${type}`;
  }

  private importUrl(type: ImportExportCsvType): string {
    return type === 'transactions' ? `${this.apiUrl}/import` : `${this.apiUrl}/import/${type}`;
  }

  private exportUrl(type: ImportExportCsvType): string {
    return type === 'transactions' ? `${this.apiUrl}/export` : `${this.apiUrl}/export/${type}`;
  }
}
