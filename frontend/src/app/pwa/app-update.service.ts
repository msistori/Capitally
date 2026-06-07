import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly updates = inject(SwUpdate);
  private readonly translate = inject(TranslateService);

  initialize(): void {
    if (!this.updates.isEnabled) return;

    this.updates.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        const message = this.translate.instant('PWA.UPDATE_AVAILABLE');

        if (window.confirm(message)) {
          document.location.reload();
        }
      });
  }
}
