import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { CurrencyModel } from './../models/currency.model';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly apiUrl = '/currency';
  private cache$?: Observable<CurrencyModel[]>;

  constructor(private http: HttpClient) {}

  getCurrencies(): Observable<CurrencyModel[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<CurrencyModel[]>
        (`${this.apiUrl}`, { })
        .pipe(shareReplay(1));
    }
    return this.cache$;
  }
}
