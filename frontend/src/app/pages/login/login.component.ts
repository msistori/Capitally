import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from 'src/app/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import { GuestService } from 'src/app/services/guest.service';
import { AnalyticsEvent } from 'src/app/analytics/analytics.events';
import { AnalyticsService } from 'src/app/analytics/analytics.service';
import { AppLanguage, LOCALIZED_ROUTES, PRIVATE_ROUTES, currentOrDefaultLanguage } from 'src/app/routing/localized-routes';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  readonly availableLanguages = ['it', 'en'];
  currentLang!: AppLanguage;
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private analytics = inject(AnalyticsService);

  constructor(private translate: TranslateService, private guestService: GuestService) {
    this.guestService.clearGuestLogin();
    this.translate.addLangs(this.availableLanguages);
    const saved = localStorage.getItem('lang');
    const browser = this.translate.getBrowserLang();
    const fallback = 'it';
    const initLang = currentOrDefaultLanguage(this.router.url, saved || browser || fallback);
    this.translate.use(initLang);
    this.currentLang = initLang;
    if (this.route.snapshot.data['authMode'] === 'register' || this.route.snapshot.queryParamMap.get('mode') === 'register') {
      this.mode.set('register');
    }
  }

  get termsLink(): string {
    return LOCALIZED_ROUTES[this.currentLang].legal.terms;
  }

  get privacyLink(): string {
    return LOCALIZED_ROUTES[this.currentLang].legal.privacy;
  }

  mode = signal<'login' | 'register'>('login');
  loading = signal(false);
  error = signal<string | null>(null);
  forgotPasswordOpen = signal(false);
  forgotPasswordSuccess = signal<string | null>(null);
  forgotPasswordError = signal<string | null>(null);

  hideLoginPassword = signal(true);
  hideRegisterPassword = signal(true);

  form = this.fb.nonNullable.group({
    usernameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    legalAccepted: [false, [Validators.requiredTrue]]
  });

  forgotPasswordForm = this.fb.nonNullable.group({
    usernameOrEmail: ['', [Validators.required]]
  });

  switchMode(m: 'login' | 'register') {
    this.mode.set(m);
    this.error.set(null);
    this.forgotPasswordOpen.set(false);
    this.forgotPasswordSuccess.set(null);
    this.forgotPasswordError.set(null);
  }

  openForgotPassword() {
    const usernameOrEmail = this.form.controls.usernameOrEmail.value.trim();
    this.forgotPasswordForm.controls.usernameOrEmail.setValue(usernameOrEmail, { emitEvent: false });
    this.forgotPasswordOpen.set(true);
    this.forgotPasswordSuccess.set(null);
    this.forgotPasswordError.set(null);
    this.error.set(null);
  }

  submitForgotPassword() {
    this.forgotPasswordSuccess.set(null);
    this.forgotPasswordError.set(null);

    const usernameOrEmail = this.forgotPasswordForm.controls.usernameOrEmail.value.trim();
    this.forgotPasswordForm.controls.usernameOrEmail.setValue(usernameOrEmail, { emitEvent: false });

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.forgotPasswordError.set(this.translate.instant('LOGIN_PAGE.FORGOT.REQUIRED'));
      return;
    }

    this.loading.set(true);
    this.auth.forgotPassword(usernameOrEmail, this.currentLang).subscribe({
      next: () => {
        this.loading.set(false);
        this.forgotPasswordSuccess.set(this.translate.instant('LOGIN_PAGE.FORGOT.SUCCESS'));
      },
      error: error => {
        this.loading.set(false);
        this.forgotPasswordError.set(this.getForgotPasswordErrorMessage(error));
      }
    });
  }

  private getForgotPasswordErrorMessage(error: any): string {
    const message = error?.error?.message;

    if (message === 'forgot_password_resend_daily_limit_exceeded') {
      return this.translate.instant('LOGIN_PAGE.FORGOT.DAILY_LIMIT_ERROR');
    }

    if (message === 'forgot_password_resend_monthly_limit_exceeded') {
      return this.translate.instant('LOGIN_PAGE.FORGOT.MONTHLY_LIMIT_ERROR');
    }

    return this.translate.instant('LOGIN_PAGE.FORGOT.ERROR');
  }

  submit() {
    this.error.set(null);
    if (this.mode() === 'login') {
      if (this.form.invalid) return;
      this.loading.set(true);
      const { usernameOrEmail, password } = this.form.getRawValue();

      this.auth.login({ usernameOrEmail: usernameOrEmail.trim(), password }).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate([PRIVATE_ROUTES.dashboard]);
        },
        error: e => {
          this.loading.set(false);
          this.error.set(e?.error?.message || this.translate.instant('LOGIN_PAGE.LOGIN.ERROR'));
        }
      });
    } else {
      const username = this.registerForm.controls.username.value.trim();
      const email = this.registerForm.controls.email.value.trim();
      this.registerForm.controls.username.setValue(username, { emitEvent: false });
      this.registerForm.controls.email.setValue(email, { emitEvent: false });

      if (this.registerForm.invalid) {
        this.registerForm.markAllAsTouched();
        if (this.registerForm.controls.email.hasError('email') || this.registerForm.controls.email.hasError('pattern')) {
          this.error.set(this.translate.instant('LOGIN_PAGE.REGISTER.EMAIL_INVALID_ERROR'));
        } else if (this.registerForm.controls.password.hasError('minlength')) {
          this.error.set(this.translate.instant('LOGIN_PAGE.REGISTER.PASSWORD_MIN_ERROR'));
        } else if (this.registerForm.controls.legalAccepted.hasError('required')) {
          this.error.set(this.translate.instant('LOGIN_PAGE.REGISTER.LEGAL_REQUIRED_ERROR'));
        }
        return;
      }

      this.loading.set(true);
      
      const { password } = this.registerForm.getRawValue();
      this.auth.register({ username, email, password, lang: this.currentLang }).pipe(
        switchMap(() =>
          this.auth.login({
            usernameOrEmail: email,
            password
          })
        )
      ).subscribe({
        next: () => {
          this.analytics.track(AnalyticsEvent.AUTH_REGISTRATION_COMPLETED);
          this.guestService.clearGuestLogin();
          this.loading.set(false);
          this.router.navigate([PRIVATE_ROUTES.dashboard]);
        },
        error: e => {
          this.loading.set(false);
          if(e?.error?.message) {
            if(e.error.message == 'user_taken_error') {
              this.error.set(this.translate.instant('LOGIN_PAGE.REGISTER.USER_TAKEN_ERROR'));
            } else if(e.error.message == 'email_taken_error') {
              this.error.set(this.translate.instant('LOGIN_PAGE.REGISTER.EMAIL_TAKEN_ERROR'));
            } else {
              this.error.set(this.translate.instant('LOGIN_PAGE.REGISTER.ERROR'));
            }
          } else {
            this.error.set(this.translate.instant('LOGIN_PAGE.REGISTER.ERROR'));
          }
        }
      });
    }
  }

  continueAsGuest() {
    this.loading.set(true);
    this.auth.loginAsGuest().subscribe({
      next: () => {
        this.guestService.setGuestLogin();
        this.loading.set(false);
        this.router.navigate([PRIVATE_ROUTES.dashboard]);
      },
      error: e => {
        this.loading.set(false);
        this.error.set(e?.error?.message || this.translate.instant('LOGIN_PAGE.GUEST_ERROR'));
      }
    });
  }
}
