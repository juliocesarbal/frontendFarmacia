import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Ajuste, DetalleAjuste, Producto } from '../../core/models';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajustes.html',
})
export class AjustesComponent implements OnInit {
  ajustes = signal<Ajuste[]>([]);
  productos = signal<Producto[]>([]);
  mostrarForm = signal(false);
  guardando = signal(false);
  error = signal('');

  cabecera: Partial<Ajuste> = this.nuevo();
  detalles = signal<DetalleAjuste[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
    this.api.list<Producto>('productos', { estado: 'ACTIVO' }).subscribe((r) => this.productos.set(r.results));
  }

  cargar(): void {
    this.api.list<Ajuste>('ajustes').subscribe((r) => this.ajustes.set(r.results));
  }

  nuevo(): Partial<Ajuste> {
    return { tipo_ajuste: 'POSITIVO', motivo: '', observacion: '' };
  }

  abrirNuevo(): void {
    this.cabecera = this.nuevo();
    this.detalles.set([this.lineaVacia()]);
    this.error.set('');
    this.mostrarForm.set(true);
  }

  lineaVacia(): DetalleAjuste {
    return { producto: 0, cantidad: '0', costo_unitario: '0' };
  }

  agregarLinea(): void {
    this.detalles.update((d) => [...d, this.lineaVacia()]);
  }

  quitarLinea(i: number): void {
    this.detalles.update((d) => d.filter((_, idx) => idx !== i));
  }

  esPositivo(): boolean {
    return this.cabecera.tipo_ajuste === 'POSITIVO';
  }

  guardar(): void {
    if (this.guardando()) return; // evita doble/triple submit
    if (!this.cabecera.motivo) {
      this.error.set('El motivo es obligatorio.');
      return;
    }
    this.guardando.set(true);
    this.error.set('');
    const payload = { ...this.cabecera, detalles: this.detalles() };
    this.api.create<Ajuste>('ajustes', payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(e?.error?.detail || 'Error al guardar el ajuste.');
      },
    });
  }

  confirmar(a: Ajuste): void {
    this.api.action<Ajuste>('ajustes', a.id, 'confirmar').subscribe({
      next: () => this.cargar(),
      error: (e) => alert(e?.error?.detail || 'No se pudo confirmar.'),
    });
  }
}
