import { Component, Input } from '@angular/core';
import { UpcomingRecurringTransactionModel } from '../../models/dashboard.model';
import { TransactionTypeEnum } from '../../models/transaction.model';

@Component({
  selector: 'app-upcoming-recurring',
  templateUrl: './upcoming-recurring.component.html',
  styleUrls: ['./upcoming-recurring.component.scss']
})
export class UpcomingRecurringComponent {
  @Input() items: UpcomingRecurringTransactionModel[] = [];

  readonly TransactionTypeEnum = TransactionTypeEnum;

  get visibleItems(): UpcomingRecurringTransactionModel[] {
    return [...(this.items || [])]
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
      .slice(0, 5);
  }

  trackByOccurrence(_index: number, item: UpcomingRecurringTransactionModel): string {
    return `${item.nextDate}-${item.description}-${item.amount}-${item.currency}`;
  }

  amountSign(item: UpcomingRecurringTransactionModel): string {
    if (item.transactionType === TransactionTypeEnum.INCOME) return '+';
    if (item.transactionType === TransactionTypeEnum.EXPENSE) return '-';
    return '';
  }
}
