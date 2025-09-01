import { Injectable, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoaderService } from './loader.service';

@Injectable({ providedIn: 'root' })
export class RouterLoadingService {
  private router = inject(Router);
  private loader = inject(LoaderService);
  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationStart)).subscribe(() => this.loader.navStart());
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError))
      .subscribe(() => this.loader.navEnd());
  }
}