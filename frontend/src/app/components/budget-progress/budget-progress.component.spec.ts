import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetProgressComponent } from './budget-progress.component';

describe('BudgetProgressComponent', () => {
  let component: BudgetProgressComponent;
  let fixture: ComponentFixture<BudgetProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BudgetProgressComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BudgetProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
