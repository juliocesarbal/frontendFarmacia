import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Importacion } from '../../core/models';

@Component({
  selector: 'app-importaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importaciones.html',
})
export class ImportacionesComponent {
  tipo = signal<'inventario-inicial' | 'compras' | 'ventas'>('inventario-inicial');
  archivo: File | null = null;
  resultado = signal<Importacion | null>(null);
  cargando = signal(false);
  error = signal('');
  confirmado = signal(false);

  constructor(private http: HttpClient) {}

  onArchivo(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.archivo = input.files?.[0] ?? null;
  }

  subir(): void {
    if (!this.archivo) {
      this.error.set('Seleccione un archivo Excel.');
      return;
    }
    this.error.set('');
    this.confirmado.set(false);
    this.cargando.set(true);
    const form = new FormData();
    form.append('archivo', this.archivo);
    this.http
      .post<Importacion>(`${environment.apiUrl}/importaciones/${this.tipo()}/`, form)
      .subscribe({
        next: (r) => {
          this.resultado.set(r);
          this.cargando.set(false);
        },
        error: (e) => {
          this.error.set(e?.error?.detail || 'Error al cargar el archivo.');
          this.cargando.set(false);
        },
      });
  }

  confirmar(): void {
    const r = this.resultado();
    if (!r) return;
    this.http.post(`${environment.apiUrl}/importaciones/${r.id}/confirmar/`, {}).subscribe({
      next: () => this.confirmado.set(true),
      error: (e) => this.error.set(e?.error?.detail || 'No se pudo confirmar.'),
    });
  }

  get filasValidas(): number {
    return this.resultado()?.registros_validos ?? 0;
  }
}
