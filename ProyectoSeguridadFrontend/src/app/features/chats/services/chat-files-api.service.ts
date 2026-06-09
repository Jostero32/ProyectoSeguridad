import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';

import { API_CONFIG } from '../../../config/api.config';
import { PresignedUrlResponse } from '../models/message.model';

interface CachedFileUrl {
  url: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatFilesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.baseUrl;

  private readonly cache = new Map<string, CachedFileUrl>();
  private readonly inflight = new Map<string, Observable<string>>();

  resolveTemporaryUrl(urlAcceso: string): Observable<string> {
    const now = Date.now();
    const cached = this.cache.get(urlAcceso);

    if (cached && cached.expiresAt > now + 30_000) {
      return of(cached.url);
    }

    const pending = this.inflight.get(urlAcceso);
    if (pending) {
      return pending;
    }

    const request$ = this.http
      .get<PresignedUrlResponse>(`${this.baseUrl}${urlAcceso}`)
      .pipe(
        tap((response) => {
          const safeExpirySeconds = Math.max(30, response.expiresInSeconds - 30);
          this.cache.set(urlAcceso, {
            url: response.url,
            expiresAt: Date.now() + safeExpirySeconds * 1000,
          });
        }),
        map((response) => response.url),
        finalize(() => {
          this.inflight.delete(urlAcceso);
        }),
        shareReplay(1),
      );

    this.inflight.set(urlAcceso, request$);
    return request$;
  }

  clearCache(): void {
    this.cache.clear();
    this.inflight.clear();
  }
}
