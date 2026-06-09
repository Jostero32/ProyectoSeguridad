import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthSessionService } from '../auth/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(AuthSessionService);
  const authHeader = session.getAuthorizationHeader();

  if (!authHeader) {
    return next(req);
  }

  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: authHeader,
    },
  });

  return next(clonedRequest);
};
