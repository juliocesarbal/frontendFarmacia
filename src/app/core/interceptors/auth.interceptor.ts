import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Refresh compartido: si varias peticiones reciben 401 a la vez, solo se
 * dispara UNA llamada a /auth/refresh/ y todas reutilizan su resultado.
 */
let refresh$: Observable<string> | null = null;

function conToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function esRutaAuth(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

/**
 * Agrega el Bearer token y maneja 401: primero intenta renovar el access
 * token con el refresh token y reintenta la peticion; solo si el refresh
 * tambien falla se cierra la sesion.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.accessToken;

  const authReq = token && !esRutaAuth(req.url) ? conToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 en login/refresh: credenciales o refresh invalidos, no reintentar.
      if (error.status !== 401 || esRutaAuth(req.url)) {
        return throwError(() => error);
      }

      // Sin refresh token guardado: cerrar sesion directamente.
      if (!auth.refreshToken) {
        auth.logout();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      // Renovar (una sola llamada compartida) y reintentar la peticion original.
      if (!refresh$) {
        refresh$ = auth.refrescar().pipe(
          shareReplay(1),
          finalize(() => (refresh$ = null)),
        );
      }

      return refresh$.pipe(
        switchMap((nuevoAccess) => next(conToken(req, nuevoAccess))),
        catchError((refreshError) => {
          // Refresh vencido o rechazado: ahora si, sesion terminada.
          auth.logout();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
