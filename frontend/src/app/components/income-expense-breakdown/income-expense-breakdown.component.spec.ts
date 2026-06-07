import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeExpenseBreakdownComponent } from './income-expense-breakdown.component';

describe('IncomeExpenseBreakdownComponent', () => {
  let component: IncomeExpenseBreakdownComponent;
  let fixture: ComponentFixture<IncomeExpenseBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeExpenseBreakdownComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IncomeExpenseBreakdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
