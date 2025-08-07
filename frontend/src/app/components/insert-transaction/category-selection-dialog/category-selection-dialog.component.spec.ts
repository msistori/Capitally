import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategorySelectionDialogComponent } from './category-selection-dialog.component';

describe('CategorySelectionDialogComponent', () => {
  let component: CategorySelectionDialogComponent;
  let fixture: ComponentFixture<CategorySelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategorySelectionDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CategorySelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
