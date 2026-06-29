import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Compra, DetalleCompra, Producto, Proveedor } from '../../core/models';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compras.html',
})
export class ComprasComponent implements OnInit {
  compras = signal<Compra[]>([]);
  proveedores = signal<Proveedor[]>([]);
  productos = signal<Producto[]>([]);
  mostrarForm = signal(false);
  guardando = signal(false);
  error = signal('');

  page = signal(1);
  totalRegistros = signal(0);
  cargandoLista = signal(false);
  readonly pageSize = 20;

  cabecera: Partial<Compra> = this.nueva();
  detalles = signal<DetalleCompra[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar(1);
    this.api.list<Proveedor>('proveedores').subscribe((r) => this.proveedores.set(r.results));
    this.api.list<Producto>('productos', { estado: 'ACTIVO' }).subscribe((r) => this.productos.set(r.results));
  }

  cargar(p = this.page()): void {
    this.page.set(p);
    this.cargandoLista.set(true);
    this.api.list<Compra>('compras', { page: p, page_size: this.pageSize }).subscribe((r) => {
      this.compras.set(r.results);
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

  nueva(): Partial<Compra> {
    const hoy = new Date().toISOString().slice(0, 10);
    return { numero_factura: '', numero_orden: '', fecha_compra: hoy, observacion: '' };
  }

  abrirNueva(): void {
    this.cabecera = this.nueva();
    this.detalles.set([this.lineaVacia()]);
    this.error.set('');
    this.mostrarForm.set(true);
  }

  lineaVacia(): DetalleCompra {
    return { producto: 0, cantidad: '0', costo_unitario: '0', fecha_vencimiento: '' };
  }

  agregarLinea(): void {
    this.detalles.update((d) => [...d, this.lineaVacia()]);
  }

  quitarLinea(i: number): void {
    this.detalles.update((d) => d.filter((_, idx) => idx !== i));
  }

  total(): number {
    return this.detalles().reduce((s, d) => s + Number(d.cantidad) * Number(d.costo_unitario), 0);
  }

  guardar(): void {
    if (this.guardando()) return; // evita doble/triple submit
    this.guardando.set(true);
    this.error.set('');
    const payload = { ...this.cabecera, detalles: this.detalles() };
    this.api.create<Compra>('compras', payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.cargar(1);
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(e?.error?.detail || 'Error al guardar la compra.');
      },
    });
  }

  confirmar(c: Compra): void {
    this.api.action<Compra>('compras', c.id, 'confirmar').subscribe({
      next: () => this.cargar(),
      error: (e) => alert(e?.error?.detail || 'No se pudo confirmar.'),
    });
  }
}
