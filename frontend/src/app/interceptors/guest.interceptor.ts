import { HttpInterceptor, HttpRequest, HttpHandler } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { EMPTY } from "rxjs";
import { GuestService } from "../services/guest.service";

@Injectable()
export class GuestInterceptor implements HttpInterceptor {
  
  constructor(private guestService: GuestService) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const path = new URL(req.urlWithParams, window.location.origin).pathname;
    
    if (
      this.guestService.isGuestUser() &&
      req.method !== 'GET' &&
      !path.startsWith('/auth/')
    ) {
      this.guestService.showGuestRestriction();
      return EMPTY;
    }
    
    return next.handle(req);
  }
}
