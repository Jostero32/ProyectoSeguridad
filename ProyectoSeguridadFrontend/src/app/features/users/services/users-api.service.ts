import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../../../config/api.config';
import {
  BloqueoResponse,
  PageResponse,
  PerfilResponse,
  PrivacidadUltimoVisto,
} from '../models/user.model';

export interface UpdateProfileRequest {
  avatar?: File | null;
  bio?: string | null;
  privacidadUltimoVisto?: PrivacidadUltimoVisto | null;
}

@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.baseUrl;

  getMe(): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(`${this.baseUrl}${API_CONFIG.endpoints.users.me}`);
  }

  getById(id: string): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(`${this.baseUrl}${API_CONFIG.endpoints.users.byId(id)}`);
  }

  searchUsers(q: string, page = 0, size = 20): Observable<PageResponse<PerfilResponse>> {
    const params = new HttpParams().set('q', q).set('page', page).set('size', size);

    return this.http.get<PageResponse<PerfilResponse>>(
      `${this.baseUrl}${API_CONFIG.endpoints.users.search}`,
      { params },
    );
  }

  updateProfile(request: UpdateProfileRequest): Observable<PerfilResponse> {
    const formData = new FormData();

    if (request.avatar) {
      formData.append('avatar', request.avatar);
    }

    if (request.bio !== undefined && request.bio !== null) {
      formData.append('bio', request.bio);
    }

    if (request.privacidadUltimoVisto) {
      formData.append('privacidadUltimoVisto', request.privacidadUltimoVisto);
    }

    return this.http.patch<PerfilResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.users.me}`,
      formData,
    );
  }

  getBlockedUsers(): Observable<BloqueoResponse[]> {
    return this.http.get<BloqueoResponse[]>(`${this.baseUrl}${API_CONFIG.endpoints.users.blocks}`);
  }

  blockUser(userId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}${API_CONFIG.endpoints.users.blockById(userId)}`,
      {},
    );
  }

  unblockUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${API_CONFIG.endpoints.users.blockById(userId)}`);
  }
}
