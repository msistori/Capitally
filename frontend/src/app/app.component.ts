import { Component, OnInit, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LoadingOverlayComponent } from './loader/loading-overlay/loading-overlay.component';
import { LoaderService } from './loader/loader.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private loader = inject(LoaderService);
  private router = inject(Router);
  loading = computed(() => this.loader.isLoading());
  disableScroll = false;
  
  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.translate.use('it');

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        const url = event.urlAfterRedirects || event.url;
        this.disableScroll = url === '/' || url === '' || url.startsWith('/login');
      });
  }

  get showFooter(): boolean {
    return !this.disableScroll;
  }
}
