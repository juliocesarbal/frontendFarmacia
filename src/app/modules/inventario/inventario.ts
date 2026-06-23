import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { InventarioItem, Lote } from '../../core/models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
})
export class InventarioComponent implements OnInit {
  items = signal<InventarioItem[]>([]);
  tipo = '';
  buscar = '';

  page = signal(1);
  total = signal(0);
  cargando = signal(false);
  readonly pageSize = 20;

  // Detalle por lotes (HU07)
  mostrarDetalle = signal(false);
  seleccionado = signal<InventarioItem | null>(null);
  lotes = signal<Lote[]>([]);
  cargandoLotes = signal(false);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar(1);
  }

  cargar(p = 1): void {
    this.page.set(p);
    this.cargando.set(true);
    this.api
      .list<InventarioItem>('inventario', {
        tipo: this.tipo,
        buscar: this.buscar,
        page: p,
        page_size: this.pageSize,
      })
      .subscribe((r) => {
        this.items.set(r.results);
        this.total.set(r.count);
        this.cargando.set(false);
      });
  }

  /** Reinicia a la primera pagina al cambiar filtros. */
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

  bajoMinimo(i: InventarioItem): boolean {
    return Number(i.cantidad_actual) <= Number(i.stock_minimo);
  }

  abrirDetalle(i: InventarioItem): void {
    this.seleccionado.set(i);
    this.lotes.set([]);
    this.cargandoLotes.set(true);
    this.mostrarDetalle.set(true);
    this.api.raw<Lote[]>(`productos/${i.producto}/capas/`).subscribe({
      next: (r) => {
        this.lotes.set(r);
        this.cargandoLotes.set(false);
      },
      error: () => this.cargandoLotes.set(false),
    });
  }

  cerrarDetalle(): void {
    this.mostrarDetalle.set(false);
  }

  valorLote(l: Lote): number {
    return Number(l.cantidad_disponible) * Number(l.costo_unitario);
  }

  vencido(l: Lote): boolean {
    return !!l.fecha_vencimiento && new Date(l.fecha_vencimiento) < new Date();
  }
}
