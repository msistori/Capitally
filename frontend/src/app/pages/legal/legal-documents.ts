import { COOKIES_EN } from './documents/cookies.en';
import { COOKIES_IT } from './documents/cookies.it';
import { PRIVACY_EN } from './documents/privacy.en';
import { PRIVACY_IT } from './documents/privacy.it';
import { TERMS_EN } from './documents/terms.en';
import { TERMS_IT } from './documents/terms.it';
import { LegalDocument, LegalDocumentKey, LegalLanguage, LegalPageCopy } from './legal-document.model';

export const LEGAL_DOCUMENT_KEYS: LegalDocumentKey[] = ['terms', 'privacy', 'cookies'];

export const LEGAL_DOCUMENTS: Record<LegalLanguage, Record<LegalDocumentKey, LegalDocument>> = {
  it: {
    terms: TERMS_IT,
    privacy: PRIVACY_IT,
    cookies: COOKIES_IT
  },
  en: {
    terms: TERMS_EN,
    privacy: PRIVACY_EN,
    cookies: COOKIES_EN
  }
};

export const LEGAL_PAGE_COPY: Record<LegalLanguage, LegalPageCopy> = {
  it: {
    backToLogin: 'Torna al login',
    backToPreviousPage: 'Torna alla pagina precedente',
    eyebrow: 'Documenti legali',
    updatedAtLabel: 'Ultimo aggiornamento',
    documentTabsAriaLabel: 'Documenti legali',
    reviewNote: 'Punto da completare o verificare con il proprietario del sito e, se necessario, con un consulente legale.',
    tabs: {
      terms: 'Termini',
      privacy: 'Privacy',
      cookies: 'Cookie'
    }
  },
  en: {
    backToLogin: 'Back to login',
    backToPreviousPage: 'Back to previous page',
    eyebrow: 'Legal documents',
    updatedAtLabel: 'Last updated',
    documentTabsAriaLabel: 'Legal documents',
    reviewNote: 'Item to complete or verify with the site owner and, if needed, with legal counsel.',
    tabs: {
      terms: 'Terms',
      privacy: 'Privacy',
      cookies: 'Cookies'
    }
  }
};

export function resolveLegalLanguage(language?: string | null): LegalLanguage {
  return language === 'en' ? 'en' : 'it';
}
