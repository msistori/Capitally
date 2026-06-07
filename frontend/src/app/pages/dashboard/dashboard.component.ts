import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import {
  AnnualIncomeExpenseResponseDTO,
  BalanceTrendResponseDTO,
  DashboardOverviewResponseDTO,
  IncomeExpenseBreakdownResponseDTO
} from '../../models/dashboard.model';
import { RefreshService } from '../../services/refresh.service';
import { StorageService } from '../../auth/storage.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  overviewData: DashboardOverviewResponseDTO = {
    totalBalancePerCurrency: {},
    accountBalances: [],
    totalIncomeThisMonth: {},
    totalExpenseThisMonth: {},
    upcomingRecurringCount: 0
  };
  yearlyBalance: BalanceTrendResponseDTO[] = [];
  annualIncomeExpense: AnnualIncomeExpenseResponseDTO[] = [];
  incomeExpenseBreakdownData: IncomeExpenseBreakdownResponseDTO[] = [];

  currentYear = new Date().getFullYear();
  annualIncomeExpenseYear = new Date().getFullYear();
  private selectedYear = new Date().getFullYear();
  private selectedMonth = new Date().getMonth();

  private storage = inject(StorageService);
  readonly userId = this.storage.getUserId() || '1';
  private sub = new Subscription();

  constructor(
    private dashboardService: DashboardService,
    private refreshService: RefreshService
  ) {}

  ngOnInit(): void {
    this.refresh();
    this.sub.add(this.refreshService.onRefresh$.subscribe(() => this.refresh()));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  refresh(): void {
    const yearStart = `${this.currentYear}-01-01`;
    const yearEnd = this.endOfRange(this.currentYear);

    this.dashboardService.getDashboardOverview().subscribe({
      next: res => this.overviewData = res,
      error: err => console.error('Error loading dashboard', err)
    });

    this.dashboardService.getYearlyBalanceTrend(yearStart, yearEnd).subscribe({
      next: data => this.yearlyBalance = [...data].sort((a, b) => a.month.localeCompare(b.month)),
      error: err => console.error('Error loading yearly balance trend', err)
    });

    this.loadAnnualIncomeExpense(this.annualIncomeExpenseYear);

    const { startDate, endDate } = this.monthRange(this.selectedYear, this.selectedMonth);
    this.dashboardService.getIncomeExpenseBreakdown(startDate, endDate).subscribe({
      next: res => this.incomeExpenseBreakdownData = res,
      error: err => console.error('Error loading income-expense breakdown', err)
    });
  }

  onMonthChange(range: { startDate: string; endDate: string }) {
    const d = new Date(range.startDate);
    this.selectedYear = d.getFullYear();
    this.selectedMonth = d.getMonth();

    this.dashboardService.getIncomeExpenseBreakdown(range.startDate, range.endDate).subscribe({
      next: res => this.incomeExpenseBreakdownData = res,
      error: err => console.error('Error loading income-expense breakdown', err)
    });
  }

  onAnnualIncomeExpenseYearChange(year: number): void {
    this.annualIncomeExpenseYear = year;
    this.loadAnnualIncomeExpense(year);
  }

  private loadAnnualIncomeExpense(year: number): void {
    this.dashboardService.getAnnualIncomeExpense(`${year}-01-01`, `${year}-12-31`).subscribe({
      next: data => this.annualIncomeExpense = [...data].sort((a, b) => a.month.localeCompare(b.month)),
      error: err => console.error('Error loading annual income-expense', err)
    });
  }

  private endOfRange(year: number): string {
    const now = new Date();
    if (now.getFullYear() === year) {
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }
    return `${year}-12-31`;
  }

  private monthRange(year: number, month0: number): { startDate: string; endDate: string } {
    const start = new Date(year, month0, 1);
    const end = new Date(year, month0 + 1, 0);
    return { startDate: this.formatLocalDate(start), endDate: this.formatLocalDate(end) };
  }

  private formatLocalDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
