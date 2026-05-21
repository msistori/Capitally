import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TransactionService } from './../../services/transaction.service';
import { RefreshService } from './../../services/refresh.service';
import { TransactionModel, TransactionTypeEnum } from './../../models/transaction.model';
import { StorageService } from './../../auth/storage.service';

@Component({
  selector: 'app-recent-transactions',
  templateUrl: './recent-transactions.component.html',
  styleUrls: ['./recent-transactions.component.scss']
})
export class RecentTransactionsComponent implements OnInit, OnDestroy {
  private storage = inject(StorageService);
  readonly userId = this.storage.getUserId() || '1';
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
        .filter(transaction => !this.isTransferTransaction(transaction))
        .slice(0, 5);
    });
  }

  private isTransferTransaction(transaction: TransactionModel): boolean {
    const transferGroupId = transaction.transferGroupId?.trim();
    return Boolean(transaction.transferCounterpartyAccountId)
      || Boolean(transferGroupId?.startsWith('TRF-'));
  }
}
