import { Component, OnInit, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LoadingOverlayComponent } from './loader/loading-overlay/loading-overlay.component';
import { LoaderService } from './loader/loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private loader = inject(LoaderService);
  loading = computed(() => this.loader.isLoading());
  
  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.translate.use('it');
  }
}
