import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, Usuario } from '../models';

const ACCESS_KEY = 'farmacia_access';
const REFRESH_KEY = 'farmacia_refresh';
const USER_KEY = 'farmacia_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;

  readonly usuario = signal<Usuario | null>(this.cargarUsuario());
  readonly autenticado = computed(() => this.usuario() !== null);

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/auth/login/`, { username, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(ACCESS_KEY, res.access);
          localStorage.setItem(REFRESH_KEY, res.refresh);
          localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
          this.usuario.set(res.usuario);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.usuario.set(null);
  }

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  guardarAccess(token: string): void {
    localStorage.setItem(ACCESS_KEY, token);
  }

  /**
   * Renueva el access token usando el refresh token guardado.
   * SimpleJWT rota el refresh (ROTATE_REFRESH_TOKENS), asi que si viene uno
   * nuevo tambien se persiste. Devuelve el nuevo access token.
   */
  refrescar(): Observable<string> {
    const refresh = this.refreshToken;
    if (!refresh) return throwError(() => new Error('Sin refresh token'));
    return this.http
      .post<{ access: string; refresh?: string }>(`${this.api}/auth/refresh/`, { refresh })
      .pipe(
        tap((res) => {
          localStorage.setItem(ACCESS_KEY, res.access);
          if (res.refresh) localStorage.setItem(REFRESH_KEY, res.refresh);
        }),
        map((res) => res.access),
      );
  }

  tienePermiso(codigo: string): boolean {
    const u = this.usuario();
    if (!u) return false;
    if (u.is_superuser) return true;
    return u.permisos.includes(codigo);
  }

  private cargarUsuario(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as Usuario) : null;
  }
}
