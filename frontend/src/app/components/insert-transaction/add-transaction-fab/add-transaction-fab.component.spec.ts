import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTransactionFabComponent } from './add-transaction-fab.component';

describe('AddTransactionFabComponent', () => {
  let component: AddTransactionFabComponent;
  let fixture: ComponentFixture<AddTransactionFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTransactionFabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddTransactionFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
