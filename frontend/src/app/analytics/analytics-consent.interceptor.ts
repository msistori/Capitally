import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsConsentInterceptor implements HttpInterceptor {
  constructor(private analytics: AnalyticsService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isExternal = req.url.startsWith('http://') || req.url.startsWith('https://');

    if (isExternal || !this.analytics.hasGrantedConsent()) {
      return next.handle(req);
    }

    return next.handle(req.clone({
      setHeaders: {
        'X-Analytics-Consent': 'true'
      }
    }));
  }
}
