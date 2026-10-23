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
  yearlyBalanceLoading = false;
  yearlyBalanceError = false;
  private yearlyBalanceSub?: Subscription;
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
    this.yearlyBalanceSub?.unsubscribe();
  }

  refresh(): void {
    this.dashboardService.getDashboardOverview().subscribe({
      next: res => this.overviewData = res,
      error: err => console.error('Error loading dashboard', err)
    });

    this.loadYearlyBalance(this.currentYear);

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

  onBalanceYearChange(year: number): void {
    if (year < 1 || year > new Date().getFullYear()) return;
    this.currentYear = year;
    this.loadYearlyBalance(year);
  }

  private loadYearlyBalance(year: number): void {
    this.yearlyBalanceSub?.unsubscribe();
    this.yearlyBalanceLoading = true;
    this.yearlyBalanceError = false;
    this.yearlyBalance = [];
    this.yearlyBalanceSub = this.dashboardService.getYearlyBalanceTrend(
      String(year).padStart(4, '0') + '-01-01', this.endOfRange(year)
    ).subscribe({
      next: data => {
        this.yearlyBalance = [...data].sort((a, b) => a.month.localeCompare(b.month));
        this.yearlyBalanceLoading = false;
      },
      error: err => {
        this.yearlyBalanceLoading = false;
        this.yearlyBalanceError = true;
        console.error('Error loading yearly balance trend', err);
      }
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
    return String(year).padStart(4, '0') + '-12-31';
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
