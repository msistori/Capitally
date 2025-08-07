import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TransactionService } from './../../services/transaction.service';
import { RefreshService } from './../../services/refresh.service';
import { TransactionModel, TransactionTypeEnum } from './../../models/transaction.model';

@Component({
  selector: 'app-recent-transactions',
  templateUrl: './recent-transactions.component.html',
  styleUrls: ['./recent-transactions.component.scss']
})
export class RecentTransactionsComponent implements OnInit, OnDestroy {
  readonly userId = '1';
  TransactionTypeEnum = TransactionTypeEnum;
  transactions: TransactionModel[] = [];
  private sub = new Subscription();

  constructor(
    private transactionService: TransactionService,
    private refreshService: RefreshService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.sub.add(this.refreshService.onRefresh$.subscribe(() => this.loadTransactions()));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private loadTransactions(): void {
    this.transactionService.getTransactions(this.userId).subscribe(res => {
      this.transactions = res
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
    });
  }
}
