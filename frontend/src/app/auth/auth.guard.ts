import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from './storage.service';


export const authGuard: CanActivateFn = () => {
    const storage = inject(StorageService);
    const router = inject(Router);
    const token = storage.getAccessToken();
    const user = storage.getUser();
    // Allow access if token exists OR a user is stored (e.g., guest login)
    if (!token && !user) { router.navigate(['/login']); return false; }
    return true;
};
