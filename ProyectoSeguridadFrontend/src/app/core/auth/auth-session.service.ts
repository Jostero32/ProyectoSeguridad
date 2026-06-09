import { Injectable, computed, signal } from '@angular/core';
import { LoginResponse } from '../../features/auth/models/auth.model';
import { PerfilResponse } from '../../features/users/models/user.model';

interface AuthSessionState {
  token: string | null;
  usuarioId: string | null;
  profile: PerfilResponse | null;
}

const TOKEN_KEY = 'messenger_token';
const USER_ID_KEY = 'messenger_usuario_id';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly initialToken = this.loadStoredValue(TOKEN_KEY);
  private readonly initialUsuarioId = this.loadStoredValue(USER_ID_KEY);

  private readonly state = signal<AuthSessionState>({
    token: this.initialToken,
    usuarioId: this.initialUsuarioId,
    profile: null,
  });

  readonly token = computed(() => this.state().token);
  readonly usuarioId = computed(() => this.state().usuarioId);
  readonly profile = computed(() => this.state().profile);
  readonly isAuthenticated = computed(() => !!this.sanitizeStoredValue(this.state().token));

  saveLogin(response: LoginResponse): void {
    if (!response?.token || !response?.usuarioId) {
      throw new Error('Respuesta de login invalida: faltan token o usuarioId');
    }

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_ID_KEY, response.usuarioId);

    this.state.update((current) => ({
      ...current,
      token: response.token,
      usuarioId: response.usuarioId,
    }));
  }

  setProfile(profile: PerfilResponse): void {
    this.state.update((current) => ({
      ...current,
      profile,
    }));
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);

    this.state.set({
      token: null,
      usuarioId: null,
      profile: null,
    });
  }

  getAuthorizationHeader(): string | null {
    const token = this.sanitizeStoredValue(this.token());
    if (!token) {
      return null;
    }

    return `Bearer ${token}`;
  }

  private sanitizeStoredValue(value: string | null): string | null {
    if (!value || value === 'undefined' || value === 'null') {
      return null;
    }

    return value;
  }

  private loadStoredValue(key: string): string | null {
    const value = localStorage.getItem(key);
    const sanitized = this.sanitizeStoredValue(value);
    if (value && !sanitized) {
      localStorage.removeItem(key);
    }

    return sanitized;
  }
}
