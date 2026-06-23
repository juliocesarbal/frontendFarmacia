import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { DetalleVenta, Producto, Venta } from '../../core/models';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.html',
})
export class VentasComponent implements OnInit {
  ventas = signal<Venta[]>([]);
  productos = signal<Producto[]>([]);
  mostrarForm = signal(false);
  guardando = signal(false);
  error = signal('');

  page = signal(1);
  totalRegistros = signal(0);
  cargandoLista = signal(false);
  readonly pageSize = 20;

  cabecera: Partial<Venta> = this.nueva();
  detalles = signal<DetalleVenta[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar(1);
    this.api.list<Producto>('productos', { estado: 'ACTIVO' }).subscribe((r) => this.productos.set(r.results));
  }

  cargar(p = this.page()): void {
    this.page.set(p);
    this.cargandoLista.set(true);
    this.api.list<Venta>('ventas', { page: p, page_size: this.pageSize }).subscribe((r) => {
      this.ventas.set(r.results);
      this.totalRegistros.set(r.count);
      this.cargandoLista.set(false);
    });
  }

  totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalRegistros() / this.pageSize));
  }
  desde(): number {
    return this.totalRegistros() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1;
  }
  hasta(): number {
    return Math.min(this.page() * this.pageSize, this.totalRegistros());
  }
  anterior(): void {
    if (this.page() > 1) this.cargar(this.page() - 1);
  }
  siguiente(): void {
    if (this.page() < this.totalPaginas()) this.cargar(this.page() + 1);
  }

  nueva(): Partial<Venta> {
    return { numero_boleta: '', tipo_venta: 'VENTA', observacion: '' };
  }

  abrirNueva(): void {
    this.cabecera = this.nueva();
    this.detalles.set([this.lineaVacia()]);
    this.error.set('');
    this.mostrarForm.set(true);
  }

  lineaVacia(): DetalleVenta {
    return { producto: 0, cantidad: '0', precio_unitario: '0' };
  }

  agregarLinea(): void {
    this.detalles.update((d) => [...d, this.lineaVacia()]);
  }

  quitarLinea(i: number): void {
    this.detalles.update((d) => d.filter((_, idx) => idx !== i));
  }

  total(): number {
    return this.detalles().reduce((s, d) => s + Number(d.cantidad) * Number(d.precio_unitario), 0);
  }

  guardar(): void {
    if (this.guardando()) return; // evita doble/triple submit
    this.guardando.set(true);
    this.error.set('');
    const payload = { ...this.cabecera, detalles: this.detalles() };
    this.api.create<Venta>('ventas', payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.cargar(1);
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(e?.error?.detail || 'Error al guardar la venta.');
      },
    });
  }

  confirmar(v: Venta): void {
    this.api.action<Venta>('ventas', v.id, 'confirmar').subscribe({
      next: () => this.cargar(),
      error: (e) => alert(e?.error?.detail || 'No se pudo confirmar.'),
    });
  }

  anular(v: Venta): void {
    const motivo = prompt('Motivo de anulacion:') || '';
    this.api.action<Venta>('ventas', v.id, 'anular', { motivo }).subscribe({
      next: () => this.cargar(),
      error: (e) => alert(e?.error?.detail || 'No se pudo anular.'),
    });
  }
}
