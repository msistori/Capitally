import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CurrentBalanceResponseDTO,
  DashboardOverviewResponseDTO,
  TransactionsSummaryResponseDTO,
  UpcomingRecurringTransactionModel,
  BalanceTrendPerCurrencyResponseDTO,
  BalanceTrendResponseDTO,
  IncomeExpenseBreakdownResponseDTO,
  AnnualIncomeExpenseResponseDTO
} from './../models/dashboard.model'; // crea qui i tipi
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = '/dashboard';

  constructor(private http: HttpClient) {}

  getDashboardOverview(): Observable<DashboardOverviewResponseDTO> {
    return this.http.get<DashboardOverviewResponseDTO>(`${this.apiUrl}/overview`);
  }

  getCurrentBalance(): Observable<CurrentBalanceResponseDTO[]> {
    return this.http.get<CurrentBalanceResponseDTO[]>(`${this.apiUrl}/current-balance`);
  }

  getTransactionsSummary(start: string, end: string): Observable<TransactionsSummaryResponseDTO> {
    const params = new HttpParams()
      .set('startDate', start)
      .set('endDate', end);
    return this.http.get<TransactionsSummaryResponseDTO>(`${this.apiUrl}/transactions-summary`, { params });
  }

  getBalanceTrend(start: string, end: string): Observable<BalanceTrendPerCurrencyResponseDTO[]> {
    const params = new HttpParams()
      .set('startDate', start)
      .set('endDate', end);
    return this.http.get<BalanceTrendPerCurrencyResponseDTO[]>(`${this.apiUrl}/balance-trend`, { params });
  }

  getIncomeExpenseBreakdown(start: string, end: string): Observable<IncomeExpenseBreakdownResponseDTO[]> {
    const params = new HttpParams()
      .set('startDate', start)
      .set('endDate', end);
    return this.http.get<IncomeExpenseBreakdownResponseDTO[]>(`${this.apiUrl}/income-expense-breakdown`, { params });
  }

  getAnnualIncomeExpense(start: string, end: string): Observable<AnnualIncomeExpenseResponseDTO[]> {
    const params = new HttpParams()
      .set('startDate', start)
      .set('endDate', end);
    return this.http.get<AnnualIncomeExpenseResponseDTO[]>(`${this.apiUrl}/annual-income-expense`, { params });
  }

  getUpcomingRecurringTransactions(untilDate: string): Observable<UpcomingRecurringTransactionModel[]> {
    const params = new HttpParams().set('untilDate', untilDate);
    return this.http.get<UpcomingRecurringTransactionModel[]>(`${this.apiUrl}/upcoming-recurring`, { params });
  }

  getYearlyBalanceTrend(startDate: string, endDate: string): Observable<BalanceTrendResponseDTO[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<BalanceTrendResponseDTO[]>(`${this.apiUrl}/balance-trend`, { params });
  }
}
