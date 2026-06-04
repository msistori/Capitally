import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { LEGAL_DOCUMENT_KEYS, LEGAL_DOCUMENTS, LEGAL_PAGE_COPY, resolveLegalLanguage } from './legal-documents';
import { LegalDocument, LegalDocumentKey, LegalLanguage, LegalPageCopy } from './legal-document.model';
import { LegalNavigationService } from '../../services/legal-navigation.service';

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './legal-page.component.html',
  styleUrls: ['./legal-page.component.scss']
})
export class LegalPageComponent implements OnInit, OnDestroy {
  document: LegalDocument = LEGAL_DOCUMENTS.it.terms;
  currentKey: LegalDocumentKey = 'terms';
  currentLanguage: LegalLanguage = 'it';
  copy: LegalPageCopy = LEGAL_PAGE_COPY.it;
  backLabel = this.copy.backToLogin;
  returnQueryParams: { returnTo: string } = { returnTo: '/login' };
  readonly documentKeys = LEGAL_DOCUMENT_KEYS;

  private routeSubscription?: Subscription;
  private querySubscription?: Subscription;
  private languageSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private legalNavigation: LegalNavigationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentLanguage = resolveLegalLanguage(
      this.translate.currentLang || localStorage.getItem('lang') || this.translate.getBrowserLang()
    );
    this.updateLocalizedContent();
    this.updateReturnTarget();

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const key = params.get('document') as LegalDocumentKey | null;
      this.currentKey = key && this.isLegalDocumentKey(key) ? key : 'terms';
      this.updateLocalizedContent();
      this.updateReturnTarget();
    });

    this.querySubscription = this.route.queryParamMap.subscribe(() => {
      this.updateReturnTarget();
    });

    this.languageSubscription = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.currentLanguage = resolveLegalLanguage(event.lang);
      this.updateLocalizedContent();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.querySubscription?.unsubscribe();
    this.languageSubscription?.unsubscribe();
  }

  returnToOrigin(): void {
    this.router.navigateByUrl(this.legalNavigation.getReturnUrl(this.router.url));
  }

  private isLegalDocumentKey(value: string): value is LegalDocumentKey {
    return LEGAL_DOCUMENT_KEYS.includes(value as LegalDocumentKey);
  }

  private updateLocalizedContent(): void {
    this.copy = LEGAL_PAGE_COPY[this.currentLanguage];
    this.document = LEGAL_DOCUMENTS[this.currentLanguage][this.currentKey];
    this.updateBackLabel();
  }

  private updateReturnTarget(): void {
    const returnUrl = this.legalNavigation.getReturnUrl(this.router.url);
    this.returnQueryParams = { returnTo: returnUrl };
    this.updateBackLabel();
  }

  private updateBackLabel(): void {
    const returnUrl = this.returnQueryParams.returnTo;
    this.backLabel = this.legalNavigation.isLoginUrl(returnUrl)
      ? this.copy.backToLogin
      : this.copy.backToPreviousPage;
  }
}
