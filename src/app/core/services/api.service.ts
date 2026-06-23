import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paginado } from '../models';

/**
 * Cliente HTTP generico para recursos REST paginados de DRF.
 * Crear un servicio por recurso extendiendo o instanciando con el path.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list<T>(path: string, params?: Record<string, string | number>): Observable<Paginado<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          httpParams = httpParams.set(k, String(v));
        }
      });
    }
    return this.http.get<Paginado<T>>(`${this.base}/${path}/`, { params: httpParams });
  }

  get<T>(path: string, id: number | string): Observable<T> {
    return this.http.get<T>(`${this.base}/${path}/${id}/`);
  }

  create<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}/${path}/`, body);
  }

  update<T>(path: string, id: number | string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.base}/${path}/${id}/`, body);
  }

  remove(path: string, id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${path}/${id}/`);
  }

  action<T>(path: string, id: number | string, accion: string, body: unknown = {}): Observable<T> {
    return this.http.post<T>(`${this.base}/${path}/${id}/${accion}/`, body);
  }

  raw<T>(path: string, params?: Record<string, string | number>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
      });
    }
    return this.http.get<T>(`${this.base}/${path}`, { params: httpParams });
  }

  /** Descarga un archivo (con token JWT via interceptor) como Blob. */
  download(path: string, params?: Record<string, string | number>): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
      });
    }
    return this.http.get(`${this.base}/${path}`, { params: httpParams, responseType: 'blob' });
  }
}
