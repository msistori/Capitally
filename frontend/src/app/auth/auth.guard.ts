import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from './storage.service';
import { currentOrDefaultLanguage, LOCALIZED_ROUTES } from '../routing/localized-routes';


export const authGuard: CanActivateFn = () => {
    const storage = inject(StorageService);
    const router = inject(Router);
    const token = storage.getAccessToken();
    const user = storage.getUser();
    const language = currentOrDefaultLanguage(router.url, localStorage.getItem('lang'));
    // Allow access if token exists OR a user is stored (e.g., guest login)
    if (!token && !user) { router.navigate([LOCALIZED_ROUTES[language].login]); return false; }
    return true;
};
