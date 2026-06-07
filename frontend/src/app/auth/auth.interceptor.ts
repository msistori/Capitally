import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../auth/storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private storage: StorageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.storage.getAccessToken();

    const isExternal = req.url.startsWith('http://') || req.url.startsWith('https://');
    const isLoginOrRegister =
      req.url.startsWith('/auth/login') ||
      req.url.startsWith('/auth/guest-login') ||
      req.url.startsWith('/auth/register');

    const shouldAuth = !isExternal && !isLoginOrRegister && !!token;

    const authReq = shouldAuth
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq);
  }
}
