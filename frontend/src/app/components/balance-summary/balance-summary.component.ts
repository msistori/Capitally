import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-balance-summary',
  templateUrl: './balance-summary.component.html',
  styleUrls: ['./balance-summary.component.scss']
})
export class BalanceSummaryComponent {
  @Input() totalBalance: number = 0;
}
