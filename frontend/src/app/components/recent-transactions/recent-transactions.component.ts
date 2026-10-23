import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TransactionService } from './../../services/transaction.service';
import { RefreshService } from './../../services/refresh.service';
import { TransactionModel, TransactionTypeEnum } from './../../models/transaction.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddTransactionModalComponent } from '../insert-transaction/add-transaction-modal/add-transaction-modal.component';

@Component({
  selector: 'app-recent-transactions',
  templateUrl: './recent-transactions.component.html',
  styleUrls: ['./recent-transactions.component.scss']
})
export class RecentTransactionsComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  TransactionTypeEnum = TransactionTypeEnum;
  transactions: TransactionModel[] = [];
  loading = false;
  loadFailed = false;
  hasMore = true;
  private nextPage = 0;
  private request?: Subscription;
  private sub = new Subscription();
  private transactionDialogRef?: MatDialogRef<AddTransactionModalComponent, TransactionModel>;

  constructor(
    private transactionService: TransactionService,
    private refreshService: RefreshService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.sub.add(this.refreshService.onRefresh$.subscribe(() => this.loadTransactions()));
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
    this.sub.unsubscribe();
  }

  private loadTransactions(): void {
    this.request?.unsubscribe();
    this.transactions = [];
    this.nextPage = 0;
    this.hasMore = true;
    this.loading = false;
    this.loadMoreTransactions();
  }

  loadMoreTransactions(): void {
    if (this.loading || !this.hasMore) return;
    this.loading = true;
    this.loadFailed = false;
    this.request = this.transactionService.getRecentTransactions(this.nextPage).subscribe({
      next: page => {
        this.transactions = [...this.transactions, ...page.content];
        this.hasMore = !page.last;
        this.nextPage++;
        this.loading = false;
      },
      error: () => {
        this.loadFailed = true;
        this.loading = false;
      }
    });
  }

  openEditTransaction(transaction: TransactionModel): void {
    if (this.transactionDialogRef) return;

    this.transactionDialogRef = this.dialog.open(AddTransactionModalComponent, {
      hasBackdrop: true,
      disableClose: false,
      closeOnNavigation: true,
      autoFocus: '.amount-field',
      delayFocusTrap: false,
      restoreFocus: false,
      panelClass: 'add-transaction-modal-panel',
      data: { transaction }
    });

    this.transactionDialogRef.afterClosed().subscribe(tx => {
      this.transactionDialogRef = undefined;
      if (tx) {
        this.refreshService.triggerRefresh();
      }
    });
  }
}
