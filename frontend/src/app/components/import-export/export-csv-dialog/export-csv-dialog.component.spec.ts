import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportCsvDialogComponent } from './export-csv-dialog.component';

describe('ExportCsvDialogComponent', () => {
  let component: ExportCsvDialogComponent;
  let fixture: ComponentFixture<ExportCsvDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportCsvDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExportCsvDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
