export type LegalLanguage = 'it' | 'en';

export type LegalDocumentKey = 'terms' | 'privacy' | 'cookies';

export interface LegalTable {
  headers: string[];
  rows: string[][];
}

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
  table?: LegalTable;
  review?: boolean;
}

export interface LegalDocument {
  title: string;
  updatedAt: string;
  intro: string[];
  sections: LegalSection[];
}

export interface LegalPageCopy {
  backToLogin: string;
  backToPreviousPage: string;
  eyebrow: string;
  updatedAtLabel: string;
  documentTabsAriaLabel: string;
  reviewNote: string;
  tabs: Record<LegalDocumentKey, string>;
}
