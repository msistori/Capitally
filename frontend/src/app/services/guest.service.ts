import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { GuestRestrictionDialogComponent } from "../components/guest-restriction-dialog/guest-restriction-dialog.component";

@Injectable({ providedIn: 'root' })
export class GuestService {
  private readonly GUEST_KEY = 'isGuestUser';
  private isGuest: boolean;

  constructor(private dialog: MatDialog) {
    this.isGuest = localStorage.getItem(this.GUEST_KEY) === 'true';
  }

  setGuestLogin() {
    this.isGuest = true;
    localStorage.setItem(this.GUEST_KEY, 'true');
  }

  clearGuestLogin() {
    this.isGuest = false;
    localStorage.removeItem(this.GUEST_KEY);
  }

  isGuestUser(): boolean {
    return this.isGuest;
  }

  showGuestRestriction() {
    this.dialog.open(GuestRestrictionDialogComponent, {
      width: '450px',
      maxWidth: 'calc(100vw - 2rem)',
      disableClose: false,
      panelClass: 'guest-dialog'
    });
  }
}
