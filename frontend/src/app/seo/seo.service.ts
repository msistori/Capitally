import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppLanguage, DEFAULT_LANGUAGE, LOCALIZED_ROUTES, LegalSlug, languageFromUrl, routePath } from '../routing/localized-routes';

type SeoKey = 'home' | 'login' | 'register' | 'install' | 'notFound' | `legal.${LegalSlug}` | 'private';

interface SeoCopy {
  title: string;
  description: string;
}

const SEO_COPY: Record<AppLanguage, Record<SeoKey, SeoCopy>> = {
  it: {
    home: {
      title: 'Capitally - Gestisci le tue finanze personali',
      description: 'Capitally aiuta a controllare conti, transazioni, budget, ricorrenze e resoconti finanziari in una dashboard semplice e mobile-first.'
    },
    login: {
      title: 'Accesso Capitally',
      description: 'Accedi a Capitally per gestire conti, movimenti, budget e resoconti delle tue finanze personali.'
    },
    register: {
      title: 'Crea account Capitally',
      description: 'Crea un account Capitally per iniziare a tracciare conti, transazioni e andamento delle tue finanze personali.'
    },
    install: {
      title: 'Installa Capitally come app',
      description: 'Scopri come installare Capitally come PWA su desktop, Android e iOS per accedere piu rapidamente alla tua app di finanza personale.'
    },
    notFound: {
      title: 'Pagina non trovata - Capitally',
      description: 'La pagina richiesta non esiste o non e piu disponibile.'
    },
    'legal.terms': {
      title: 'Termini e Condizioni - Capitally',
      description: 'Consulta i termini e le condizioni di utilizzo di Capitally.'
    },
    'legal.privacy': {
      title: 'Privacy Policy - Capitally',
      description: 'Consulta la Privacy Policy di Capitally e scopri come vengono trattati i dati personali.'
    },
    'legal.cookies': {
      title: 'Cookie Policy - Capitally',
      description: 'Consulta la Cookie Policy di Capitally e scopri come vengono usati cookie e tecnologie simili.'
    },
    private: {
      title: 'Capitally',
      description: 'Area privata Capitally.'
    }
  },
  en: {
    home: {
      title: 'Capitally - Personal finance tracker',
      description: 'Capitally helps you manage accounts, transactions, budgets, recurring activity and financial summaries in a simple mobile-first dashboard.'
    },
    login: {
      title: 'Sign in to Capitally',
      description: 'Sign in to Capitally to manage accounts, transactions, budgets and personal finance summaries.'
    },
    register: {
      title: 'Create a Capitally account',
      description: 'Create a Capitally account to start tracking accounts, transactions and personal finance trends.'
    },
    install: {
      title: 'Install Capitally as an app',
      description: 'Learn how to install Capitally as a PWA on desktop, Android and iOS for faster access to your personal finance app.'
    },
    notFound: {
      title: 'Page not found - Capitally',
      description: 'The requested page does not exist or is no longer available.'
    },
    'legal.terms': {
      title: 'Terms and Conditions - Capitally',
      description: 'Read the terms and conditions for using Capitally.'
    },
    'legal.privacy': {
      title: 'Privacy Policy - Capitally',
      description: 'Read the Capitally Privacy Policy and learn how personal data is handled.'
    },
    'legal.cookies': {
      title: 'Cookie Policy - Capitally',
      description: 'Read the Capitally Cookie Policy and learn how cookies and similar technologies are used.'
    },
    private: {
      title: 'Capitally',
      description: 'Capitally private area.'
    }
  }
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  initialize(): void {
    this.applyCurrentRoute();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.applyCurrentRoute());
  }

  private applyCurrentRoute(): void {
    const snapshot = this.deepestRoute(this.router.routerState.snapshot.root);
    const language = this.resolveLanguage(snapshot);
    const seoKey = this.resolveSeoKey(snapshot);
    const copy = SEO_COPY[language][seoKey] || SEO_COPY[language].home;
    const robots = snapshot.data['robots'] || (seoKey === 'private' ? 'noindex,nofollow' : 'index,follow');
    const canonical = this.canonicalUrl(routePath(this.router.url));

    this.document.documentElement.lang = language;
    this.title.setTitle(copy.title);
    this.setTag('name', 'description', copy.description);
    this.setTag('name', 'robots', robots);
    this.setTag('property', 'og:type', 'website');
    this.setTag('property', 'og:site_name', 'Capitally');
    this.setTag('property', 'og:title', copy.title);
    this.setTag('property', 'og:description', copy.description);
    this.setTag('property', 'og:url', canonical);
    this.setTag('property', 'og:image', this.absoluteUrl('/assets/og-capitally.png'));
    this.setTag('name', 'twitter:card', 'summary_large_image');
    this.setTag('name', 'twitter:title', copy.title);
    this.setTag('name', 'twitter:description', copy.description);
    this.setTag('name', 'twitter:image', this.absoluteUrl('/assets/og-capitally.png'));
    this.setCanonical(canonical);
    this.setHreflang(snapshot, seoKey);
  }

  private deepestRoute(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = route;

    while (current.firstChild) {
      current = current.firstChild;
    }

    return current;
  }

  private resolveLanguage(snapshot: ActivatedRouteSnapshot): AppLanguage {
    return snapshot.data['lang'] || languageFromUrl(this.router.url) || DEFAULT_LANGUAGE;
  }

  private resolveSeoKey(snapshot: ActivatedRouteSnapshot): SeoKey {
    const key = snapshot.data['seoKey'] as SeoKey | undefined;

    return key || 'private';
  }

  private setTag(attribute: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attribute]: key, content });
  }

  private setCanonical(url: string): void {
    this.setLink('canonical', url);
  }

  private setHreflang(snapshot: ActivatedRouteSnapshot, seoKey: SeoKey): void {
    this.removeHreflangLinks();

    if (!snapshot.data['indexable']) return;

    const paths = this.localizedPathsFor(seoKey);
    if (!paths) return;

    this.addAlternate('it', this.absoluteUrl(paths.it));
    this.addAlternate('en', this.absoluteUrl(paths.en));
    this.addAlternate('x-default', this.absoluteUrl(paths.en));
  }

  private localizedPathsFor(seoKey: SeoKey): Record<AppLanguage, string> | null {
    if (seoKey === 'home') return { it: LOCALIZED_ROUTES.it.home, en: LOCALIZED_ROUTES.en.home };
    if (seoKey === 'install') return { it: LOCALIZED_ROUTES.it.install, en: LOCALIZED_ROUTES.en.install };
    if (seoKey === 'legal.terms') return { it: LOCALIZED_ROUTES.it.legal.terms, en: LOCALIZED_ROUTES.en.legal.terms };
    if (seoKey === 'legal.privacy') return { it: LOCALIZED_ROUTES.it.legal.privacy, en: LOCALIZED_ROUTES.en.legal.privacy };
    if (seoKey === 'legal.cookies') return { it: LOCALIZED_ROUTES.it.legal.cookies, en: LOCALIZED_ROUTES.en.legal.cookies };

    return null;
  }

  private addAlternate(hreflang: string, href: string): void {
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    link.setAttribute('href', href);
    this.document.head.appendChild(link);
  }

  private removeHreflangLinks(): void {
    this.document.head
      .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')
      .forEach(link => link.remove());
  }

  private setLink(rel: string, href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', rel);
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', href);
  }

  private canonicalUrl(path: string): string {
    return this.absoluteUrl(path || '/');
  }

  private absoluteUrl(path: string): string {
    const configuredUrl = environment.siteUrl?.replace(/\/+$/, '');
    const origin = configuredUrl || this.document.location.origin;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${origin}${normalizedPath}`;
  }
}
