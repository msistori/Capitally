import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExportTransactionsComponent } from './import-export-transactions.component';

describe('ImportExportTransactionsComponent', () => {
  let component: ImportExportTransactionsComponent;
  let fixture: ComponentFixture<ImportExportTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportExportTransactionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImportExportTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
