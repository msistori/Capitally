import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-budget-progress',
  templateUrl: './budget-progress.component.html',
  styleUrls: ['./budget-progress.component.scss']
})
export class BudgetProgressComponent implements OnInit {

  @Input() progress?: { category: string; used: number; total: number; }[];

  constructor() { }

  ngOnInit(): void {
  }

}
