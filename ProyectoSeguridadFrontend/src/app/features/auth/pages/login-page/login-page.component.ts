import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthApiService } from '../../services/auth-api.service';
import { UsersApiService } from '../../../users/services/users-api.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly session = inject(AuthSessionService);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly passwordVisible = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [true],
  });

  readonly canSubmit = computed(() => !this.loading());

  togglePasswordVisibility(): void {
    this.passwordVisible.update((value) => !value);
  }

  fieldInvalid(fieldName: 'email' | 'password'): boolean {
    const field = this.form.controls[fieldName];
    return field.invalid && (field.touched || field.dirty);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.authApi
      .login({ email, password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.usersApi.getMe().subscribe({
            next: (profile) => {
              this.session.setProfile(profile);
              this.router.navigate(['/messenger']);
            },
            error: (error) => {
              this.session.clear();
              this.errorMessage.set(
                error?.error?.message ||
                  error?.error?.error ||
                  'El login fue aceptado, pero no se pudo validar la sesion. Intenta iniciar sesion otra vez.',
              );
            },
          });
        },
        error: (error) => {
          const message =
            error?.error?.message ||
            error?.error?.error ||
            'No se pudo iniciar sesión. Revisa tus credenciales.';

          this.errorMessage.set(message);
        },
      });
  }
}
