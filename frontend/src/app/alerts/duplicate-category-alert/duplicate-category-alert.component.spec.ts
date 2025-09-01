import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DuplicateCategoryAlertComponent } from './duplicate-category-alert.component';

describe('DuplicateCategoryAlertComponent', () => {
  let component: DuplicateCategoryAlertComponent;
  let fixture: ComponentFixture<DuplicateCategoryAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DuplicateCategoryAlertComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DuplicateCategoryAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
