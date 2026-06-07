import { TransactionTypeEnum } from "./transaction.model";

export interface ImportExportTransactionsModel {
  result: ImportResult;
  summary: ImportSummary;
  errors?: ImportError[];
}

export enum ImportResult {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export interface ImportSummary {
  totalRows: number;
  importedTransactions: number;
  importedTransfers?: number;
  importedAccounts?: number;
  newAccounts: string[];
  newCategories: { [key: string]: string[] };
}

export interface ImportError {
  rowNumber?: number;
  field?: string;
  message: string;
  value?: string;
}

export class ImportResponseHelper {
  static isSuccess(response: ImportExportTransactionsModel): boolean {
    return response?.result === ImportResult.SUCCESS;
  }

  static hasErrors(response: ImportExportTransactionsModel): boolean {
    return response?.errors !== undefined && 
           response?.errors !== null && 
           response.errors.length > 0;
  }

  static getErrorMessages(response: ImportExportTransactionsModel): string[] {
    if (!response?.errors) return [];
    return response.errors.map(error => error.message);
  }

  static hasNewItems(response: ImportExportTransactionsModel): boolean {
    const hasNewAccounts = response?.summary?.newAccounts && 
                          response.summary.newAccounts.length > 0;
    const hasNewCategories = response?.summary?.newCategories && 
                            Object.keys(response.summary.newCategories).length > 0;
    return hasNewAccounts || hasNewCategories;
  }
}

export interface TransactionExportFilterInputDTO {
  account?: string;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
  startDate?: string;
  endDate?: string;
  macroCategory?: string;
  category?: string;
  currency?: string;
  transactionType?: TransactionTypeEnum;
}

export type ImportExportCsvType = 'transactions' | 'transfers' | 'accounts';

export interface ImportCsvDialogResult {
  file: File;
  type: ImportExportCsvType;
}
