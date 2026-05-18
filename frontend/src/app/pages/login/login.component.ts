import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from 'src/app/services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import { GuestService } from 'src/app/services/guest.service';

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
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  constructor(private translate: TranslateService, private guestService: GuestService) {
    this.guestService.clearGuestLogin();
  }

  mode = signal<'login' | 'register'>('login');
  loading = signal(false);
  error = signal<string | null>(null);

  hideLoginPassword = signal(true);
  hideRegisterPassword = signal(true);

  form = this.fb.nonNullable.group({
    usernameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  switchMode(m: 'login' | 'register') {
    this.mode.set(m);
    this.error.set(null);
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
          this.router.navigate(['/dashboard']);
        },
        error: e => {
          this.loading.set(false);
          this.error.set(e?.error?.message || this.translate.instant('LOGIN_PAGE.LOGIN.ERROR'));
        }
      });
    } else {
      if (this.registerForm.invalid) {
        if (this.registerForm.controls.password.hasError('minlength')) {
          this.error.set(this.translate.instant('LOGIN_PAGE.REGISTER.PASSWORD_MIN_ERROR'));
        }
        return;
      }

      this.loading.set(true);
      
      const { username, email, password } = this.registerForm.getRawValue();
      this.auth.register(this.registerForm.getRawValue()).pipe(
        switchMap(() =>
          this.auth.login({
            usernameOrEmail: email,
            password
          })
        )
      ).subscribe({
        next: () => {
          this.guestService.clearGuestLogin();
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
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
        this.router.navigate(['/dashboard']);
      },
      error: e => {
        this.loading.set(false);
        this.error.set(e?.error?.message || this.translate.instant('LOGIN_PAGE.GUEST_ERROR'));
      }
    });
  }
}
