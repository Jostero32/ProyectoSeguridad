import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap, tap } from 'rxjs';

import { API_CONFIG } from '../../../config/api.config';
import {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegistroRequest,
  ResetPasswordRequest,
  SesionResponse,
} from '../models/auth.model';
import { PerfilResponse } from '../../users/models/user.model';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { ApiCryptoService } from '../../../core/crypto/api-crypto.service';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(AuthSessionService);
  private readonly apiCrypto = inject(ApiCryptoService);

  private readonly baseUrl = API_CONFIG.baseUrl;

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse | unknown>(`${this.baseUrl}${API_CONFIG.endpoints.auth.login}`, request)
      .pipe(
        switchMap((response) => from(this.apiCrypto.decryptEnvelopeIfNeeded<LoginResponse>(response))),
        tap((response) => {
          this.session.saveLogin(response);
        }),
      );
  }

  register(request: RegistroRequest): Observable<PerfilResponse> {
    return this.http.post<PerfilResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.users.register}`,
      request,
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}${API_CONFIG.endpoints.auth.forgotPassword}`,
      request,
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}${API_CONFIG.endpoints.auth.resetPassword}`,
      request,
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}${API_CONFIG.endpoints.auth.logout}`, {});
  }

  logoutAll(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}${API_CONFIG.endpoints.auth.logoutAll}`, {});
  }

  getSessions(): Observable<SesionResponse[]> {
    return this.http.get<SesionResponse[]>(`${this.baseUrl}${API_CONFIG.endpoints.auth.sessions}`);
  }
}
