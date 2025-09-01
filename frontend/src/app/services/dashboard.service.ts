import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CurrentBalanceResponseDTO,
  DashboardOverviewResponseDTO,
  TransactionsSummaryResponseDTO,
  UpcomingRecurringTransactionModel,
  BalanceTrendPerCurrencyResponseDTO,
  BalanceTrendResponseDTO,
  IncomeExpenseBreakdownResponseDTO
} from './../models/dashboard.model'; // crea qui i tipi
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = '/dashboard';

  constructor(private http: HttpClient) {}

  getDashboardOverview(userId: string): Observable<DashboardOverviewResponseDTO> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<DashboardOverviewResponseDTO>(`${this.apiUrl}/overview`, { params });
  }

  getCurrentBalance(userId: string): Observable<CurrentBalanceResponseDTO[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<CurrentBalanceResponseDTO[]>(`${this.apiUrl}/current-balance`, { params });
  }

  getTransactionsSummary(userId: string, start: string, end: string): Observable<TransactionsSummaryResponseDTO> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('startDate', start)
      .set('endDate', end);
    return this.http.get<TransactionsSummaryResponseDTO>(`${this.apiUrl}/transactions-summary`, { params });
  }

  getBalanceTrend(userId: string, start: string, end: string): Observable<BalanceTrendPerCurrencyResponseDTO[]> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('startDate', start)
      .set('endDate', end);
    return this.http.get<BalanceTrendPerCurrencyResponseDTO[]>(`${this.apiUrl}/balance-trend`, { params });
  }

  getIncomeExpenseBreakdown(userId: string, start: string, end: string): Observable<IncomeExpenseBreakdownResponseDTO[]> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('startDate', start)
      .set('endDate', end);
    return this.http.get<IncomeExpenseBreakdownResponseDTO[]>(`${this.apiUrl}/income-expense-breakdown`, { params });
  }

  getUpcomingRecurringTransactions(userId: string, untilDate: string): Observable<UpcomingRecurringTransactionModel[]> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('untilDate', untilDate);
    return this.http.get<UpcomingRecurringTransactionModel[]>(`${this.apiUrl}/upcoming-recurring`, { params });
  }

  getYearlyBalanceTrend(userId: string, startDate: string, endDate: string): Observable<BalanceTrendResponseDTO[]> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<BalanceTrendResponseDTO[]>(`${this.apiUrl}/balance-trend`, { params });
  }
}
