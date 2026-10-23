import { HttpContext, HttpContextToken } from '@angular/common/http';

export const SESSION_REQUEST = new HttpContextToken<boolean>(() => false);
export const sessionContext = () => new HttpContext().set(SESSION_REQUEST, true);
