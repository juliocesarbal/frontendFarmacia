import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Categoria, Producto, Unidad } from '../../core/models';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
})
export class ProductosComponent implements OnInit {
  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  unidades = signal<Unidad[]>([]);
  buscar = '';
  cargando = signal(false);

  page = signal(1);
  total = signal(0);
  readonly pageSize = 20;

  mostrarForm = signal(false);
  modelo: Partial<Producto> = this.nuevo();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar(1);
    this.api.list<Categoria>('categorias', { page_size: 200 }).subscribe((r) => this.categorias.set(r.results));
    this.api.list<Unidad>('unidades', { page_size: 200 }).subscribe((r) => this.unidades.set(r.results));
  }

  cargar(p = this.page()): void {
    this.page.set(p);
    this.cargando.set(true);
    this.api
      .list<Producto>('productos', { buscar: this.buscar, page: p, page_size: this.pageSize })
      .subscribe((r) => {
        this.productos.set(r.results);
        this.total.set(r.count);
        this.cargando.set(false);
      });
  }

  /** Reinicia a la primera pagina al buscar. */
  filtrar(): void {
    this.cargar(1);
  }

  totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }
  desde(): number {
    return this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1;
  }
  hasta(): number {
    return Math.min(this.page() * this.pageSize, this.total());
  }
  anterior(): void {
    if (this.page() > 1) this.cargar(this.page() - 1);
  }
  siguiente(): void {
    if (this.page() < this.totalPaginas()) this.cargar(this.page() + 1);
  }

  nuevo(): Partial<Producto> {
    return {
      codigo_producto: '',
      nombre: '',
      tipo_producto: 'MEDICAMENTO',
      precio_venta: '0',
      costo_referencial: '0',
      stock_minimo: '0',
      estado: 'ACTIVO',
    };
  }

  abrirNuevo(): void {
    this.modelo = this.nuevo();
    this.mostrarForm.set(true);
  }

  editar(p: Producto): void {
    this.modelo = { ...p };
    this.mostrarForm.set(true);
  }

  guardar(): void {
    const obs = this.modelo.id
      ? this.api.update<Producto>('productos', this.modelo.id, this.modelo)
      : this.api.create<Producto>('productos', this.modelo);
    obs.subscribe(() => {
      this.mostrarForm.set(false);
      this.cargar();
    });
  }

  anular(p: Producto): void {
    this.api.action('productos', p.id, 'anular').subscribe(() => this.cargar());
  }

  restaurar(p: Producto): void {
    this.api.action('productos', p.id, 'restaurar').subscribe(() => this.cargar());
  }
}
