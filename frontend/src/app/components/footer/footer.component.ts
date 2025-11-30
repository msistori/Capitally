import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../auth/storage.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  private router = inject(Router);
  private storage = inject(StorageService);

  get showFab(): boolean {
    const token = this.storage.getAccessToken();
    const user = this.storage.getUser();
    const url = this.router.url || '';
    // Show FAB if authenticated by token or guest user is present
    return (!!token || !!user) && !url.startsWith('/login');
  }
}
