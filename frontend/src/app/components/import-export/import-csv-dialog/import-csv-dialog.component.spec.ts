import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportCsvDialogComponent } from './import-csv-dialog.component';

describe('ImportCsvDialogComponent', () => {
  let component: ImportCsvDialogComponent;
  let fixture: ComponentFixture<ImportCsvDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportCsvDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImportCsvDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
