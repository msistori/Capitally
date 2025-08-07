import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { CurrencyService } from '../../services/currency.service';
import { TranslateService } from '@ngx-translate/core';
import { DashboardOverviewResponseDTO } from '../../models/dashboard.model';
import { CurrencyModel } from '../../models/currency.model';
import { RefreshService } from '../../services/refresh.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly availableLanguages = ['it', 'en'];
  currentLang!: string;
  overviewData?: DashboardOverviewResponseDTO;
  currencies?: CurrencyModel[];
  readonly userId = '1';
  private sub = new Subscription();

  constructor(
    private dashboardService: DashboardService,
    private currencyService: CurrencyService,
    private translate: TranslateService,
    private refreshService: RefreshService
  ) {
    this.translate.addLangs(this.availableLanguages);
    const saved = localStorage.getItem('lang');
    const browser = this.translate.getBrowserLang();
    const fallback = 'it';
    const initLang = saved && this.availableLanguages.includes(saved)
      ? saved
      : browser && this.availableLanguages.includes(browser) ? browser : fallback;
    this.translate.use(initLang);
    this.currentLang = initLang;
  }

  ngOnInit(): void {
    this.refresh();
    this.sub.add(this.refreshService.onRefresh$.subscribe(() => this.refresh()));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  refresh(): void {
    this.dashboardService.getDashboardOverview(this.userId).subscribe(
      res => this.overviewData = res,
      err => console.error('Error loading dashboard', err)
    );
  }

  changeLanguage(lang: string): void {
    if (lang !== this.currentLang && this.availableLanguages.includes(lang)) {
      this.translate.use(lang);
      this.currentLang = lang;
      localStorage.setItem('lang', lang);
    }
  }
}
