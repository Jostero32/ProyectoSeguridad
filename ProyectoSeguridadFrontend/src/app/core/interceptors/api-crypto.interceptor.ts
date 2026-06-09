import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, from, mergeMap, switchMap, throwError } from 'rxjs';

import { API_CONFIG } from '../../config/api.config';
import { ApiCryptoService } from '../crypto/api-crypto.service';

export const apiCryptoInterceptor: HttpInterceptorFn = (req, next) => {
  const cryptoService = inject(ApiCryptoService);

  if (!shouldUseApiCrypto(req)) {
    return next(req);
  }

  return from(buildEncryptedRequest(req, cryptoService)).pipe(
    switchMap((encryptedRequest) => handleEncryptedResponse(encryptedRequest, next, cryptoService)),
  );
};

function handleEncryptedResponse(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  cryptoService: ApiCryptoService,
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    mergeMap((event) => {
      if (!(event instanceof HttpResponse) || !cryptoService.isEnvelope(event.body)) {
        return from([event]);
      }

      return from(cryptoService.decryptEnvelope(event.body)).pipe(
        mergeMap((body) => from([event.clone({ body })])),
      );
    }),
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || !cryptoService.isEnvelope(error.error)) {
        return throwError(() => error);
      }

      return from(cryptoService.decryptEnvelope(error.error)).pipe(
        mergeMap((decryptedError) =>
          throwError(
            () =>
              new HttpErrorResponse({
                error: decryptedError,
                headers: error.headers,
                status: error.status,
                statusText: error.statusText,
                url: error.url ?? undefined,
              }),
          ),
        ),
      );
    }),
  );
}

async function buildEncryptedRequest(
  req: HttpRequest<unknown>,
  cryptoService: ApiCryptoService,
): Promise<HttpRequest<unknown>> {
  const headers = req.headers.set(cryptoService.headerName, cryptoService.version);

  if (!shouldEncryptBody(req.body)) {
    return req.clone({ headers });
  }

  const envelope = await cryptoService.encryptValue(req.body);
  return req.clone({
    body: envelope,
    headers: headers.set('Content-Type', 'application/json'),
  });
}

function shouldUseApiCrypto(req: HttpRequest<unknown>): boolean {
  if (req.responseType !== 'json') {
    return false;
  }

  return req.url.startsWith(API_CONFIG.baseUrl);
}

function shouldEncryptBody(body: unknown): boolean {
  if (body === null || body === undefined) {
    return false;
  }

  return !(
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  );
}
