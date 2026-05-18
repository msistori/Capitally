import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestRestrictionDialogComponent } from './guest-restriction-dialog.component';

describe('GuestRestrictionDialogComponent', () => {
  let component: GuestRestrictionDialogComponent;
  let fixture: ComponentFixture<GuestRestrictionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestRestrictionDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GuestRestrictionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
