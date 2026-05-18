import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateCsvDialogComponent } from './template-csv-dialog.component';

describe('TemplateCsvDialogComponent', () => {
  let component: TemplateCsvDialogComponent;
  let fixture: ComponentFixture<TemplateCsvDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateCsvDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TemplateCsvDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
