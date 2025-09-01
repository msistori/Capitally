import { Injectable, computed, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class LoaderService {
  private http = signal(0);
  private nav = signal(0);
  readonly isLoading = computed(() => this.http() > 0 || this.nav() > 0);
  httpStart() { this.http.set(this.http() + 1); }
  httpEnd() { this.http.set(Math.max(0, this.http() - 1)); }
  navStart() { this.nav.set(this.nav() + 1); }
  navEnd() { this.nav.set(Math.max(0, this.nav() - 1)); }
}