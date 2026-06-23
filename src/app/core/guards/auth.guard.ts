import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/** Requiere sesion activa. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.autenticado()) return true;
  router.navigate(['/login']);
  return false;
};

/** Requiere un permiso concreto (data.permiso en la ruta). */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permiso = route.data?.['permiso'] as string | undefined;
  if (!permiso || auth.tienePermiso(permiso)) return true;
  router.navigate(['/dashboard']);
  return false;
};
