import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';

interface OpenErApiResponse {
  result: 'success' | 'error';
  base_code: string;
  rates: { [code: string]: number };
}

@Injectable({ providedIn: 'root' })
export class FxRateService {
  private cache = new Map<string, Observable<Record<string, number>>>();

  constructor(private http: HttpClient) {}

  getRates(base: string): Observable<Record<string, number>> {
    const key = base.toUpperCase();
    if (!this.cache.has(key)) {
      const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(key)}`;
      const obs = this.http.get<OpenErApiResponse>(url).pipe(
        map(r => (r && r.result === 'success' && r.rates) ? r.rates : {}),
        catchError(() => of({} as Record<string, number>)),
        shareReplay(1)
      );
      this.cache.set(key, obs);
    }
    return this.cache.get(key)!;
  }
}
