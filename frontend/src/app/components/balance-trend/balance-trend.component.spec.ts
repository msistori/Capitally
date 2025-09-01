import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceTrendComponent } from './balance-trend.component';

describe('BalanceTrendComponent', () => {
  let component: BalanceTrendComponent;
  let fixture: ComponentFixture<BalanceTrendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceTrendComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BalanceTrendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
