import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);

  readonly form = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    fechaNacimiento: ['', [Validators.required]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly canSubmit = computed(() => !this.loading());

  togglePasswordVisibility(): void {
    this.passwordVisible.update((value) => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((value) => !value);
  }

  fieldInvalid(
    fieldName:
      | 'nombres'
      | 'apellidos'
      | 'fechaNacimiento'
      | 'username'
      | 'email'
      | 'password'
      | 'confirmPassword',
  ): boolean {
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

    if (this.form.invalid || this.passwordsDoNotMatch() || this.loading()) {
      this.form.markAllAsTouched();

      if (this.passwordsDoNotMatch()) {
        this.errorMessage.set('Las contraseñas no coinciden.');
      }

      return;
    }

    this.loading.set(true);

    const { confirmPassword: _confirmPassword, ...request } = this.form.getRawValue();

    this.authApi
      .register(request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Cuenta creada correctamente. Ya puedes iniciar sesión.');

          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 700);
        },
        error: (error) => {
          const message =
            error?.error?.message ||
            error?.error?.error ||
            'No se pudo crear la cuenta. Revisa los datos ingresados.';

          this.errorMessage.set(message);
        },
      });
  }
}
