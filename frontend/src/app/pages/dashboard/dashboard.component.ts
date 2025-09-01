import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { BalanceTrendResponseDTO, DashboardOverviewResponseDTO, IncomeExpenseBreakdownResponseDTO } from '../../models/dashboard.model';
import { RefreshService } from '../../services/refresh.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  overviewData: DashboardOverviewResponseDTO = {
    totalBalancePerCurrency: {},
    totalIncomeThisMonth: {},
    totalExpenseThisMonth: {},
    upcomingRecurringCount: []
  };
  yearlyBalance: BalanceTrendResponseDTO[] = [];
  incomeExpenseBreakdownData: IncomeExpenseBreakdownResponseDTO[] = [];

  currentYear = new Date().getFullYear();
  private selectedYear = new Date().getFullYear();
  private selectedMonth = new Date().getMonth();

  readonly userId = '1';
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

    this.dashboardService.getDashboardOverview(this.userId).subscribe({
      next: res => this.overviewData = res,
      error: err => console.error('Error loading dashboard', err)
    });

    this.dashboardService.getYearlyBalanceTrend(this.userId, yearStart, yearEnd).subscribe({
      next: data => this.yearlyBalance = [...data].sort((a, b) => a.month.localeCompare(b.month)),
      error: err => console.error('Error loading yearly balance trend', err)
    });

    const { startDate, endDate } = this.monthRange(this.selectedYear, this.selectedMonth);
    this.dashboardService.getIncomeExpenseBreakdown(this.userId, startDate, endDate).subscribe({
      next: res => this.incomeExpenseBreakdownData = res,
      error: err => console.error('Error loading income-expense breakdown', err)
    });
  }

  onMonthChange(range: { startDate: string; endDate: string }) {
    const d = new Date(range.startDate);
    this.selectedYear = d.getFullYear();
    this.selectedMonth = d.getMonth();

    this.dashboardService.getIncomeExpenseBreakdown(this.userId, range.startDate, range.endDate).subscribe({
      next: res => this.incomeExpenseBreakdownData = res,
      error: err => console.error('Error loading income-expense breakdown', err)
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
