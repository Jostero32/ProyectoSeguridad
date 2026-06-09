import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly token = signal<string | null>(null);
  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);

  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly canSubmit = computed(() => !this.loading() && !!this.token());

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.errorMessage.set('El enlace de recuperación no es válido o no contiene un token.');
      return;
    }

    this.token.set(token);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((value) => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((value) => !value);
  }

  fieldInvalid(fieldName: 'password' | 'confirmPassword'): boolean {
    const field = this.form.controls[fieldName];
    return field.invalid && (field.touched || field.dirty);
  }

  passwordsDoNotMatch(): boolean {
    const password = this.form.controls.password.value;
    const confirmPassword = this.form.controls.confirmPassword.value;
    const touched =
      this.form.controls.confirmPassword.touched || this.form.controls.confirmPassword.dirty;

    return touched && !!confirmPassword && password !== confirmPassword;
  }

  submit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.token()) {
      this.errorMessage.set('El token de recuperación no es válido.');
      return;
    }

    if (this.form.invalid || this.passwordsDoNotMatch() || this.loading()) {
      this.form.markAllAsTouched();

      if (this.passwordsDoNotMatch()) {
        this.errorMessage.set('Las contraseñas no coinciden.');
      }

      return;
    }

    this.loading.set(true);

    this.authApi
      .resetPassword({
        token: this.token()!,
        password: this.form.controls.password.value,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set(
            'Contraseña actualizada correctamente. Ahora puedes iniciar sesión.',
          );

          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 900);
        },
        error: (error) => {
          const message =
            error?.error?.message ||
            error?.error?.error ||
            'No se pudo restablecer la contraseña. El enlace puede estar vencido.';

          this.errorMessage.set(message);
        },
      });
  }
}
