import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Categoria, MotivoBaja, Proveedor } from '../../core/models';

type Tipo = 'compras' | 'ventas' | 'bajas' | 'ajustes' | 'inventario' | 'trazabilidad';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
})
export class ReportesComponent implements OnInit {
  tipo = signal<Tipo>('compras');
  desde = '';
  hasta = '';
  datos = signal<any>(null);
  cargando = signal(false);
  exportando = signal(false);

  // Filtros segmentables
  estado = '';
  tipoVenta = '';
  tipoProd = '';
  proveedor = '';
  motivo = '';
  categoria = '';
  modulo = '';

  // Catalogos para los selects
  proveedores = signal<Proveedor[]>([]);
  motivos = signal<MotivoBaja[]>([]);
  categorias = signal<Categoria[]>([]);

  readonly tabs: { id: Tipo; label: string; icono: string }[] = [
    { id: 'compras', label: 'Compras', icono: 'bi-cart-check' },
    { id: 'ventas', label: 'Ventas', icono: 'bi-cash-coin' },
    { id: 'bajas', label: 'Bajas', icono: 'bi-trash3' },
    { id: 'ajustes', label: 'Ajustes', icono: 'bi-sliders' },
    { id: 'inventario', label: 'Inventario', icono: 'bi-box-seam' },
    { id: 'trazabilidad', label: 'Trazabilidad', icono: 'bi-clock-history' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.hasta = hoy.toISOString().slice(0, 10);
    this.desde = new Date(hoy.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    this.api.list<Proveedor>('proveedores', { page_size: 200 }).subscribe((r) => this.proveedores.set(r.results));
    this.api.list<MotivoBaja>('motivos-baja', { page_size: 200 }).subscribe((r) => this.motivos.set(r.results));
    this.api.list<Categoria>('categorias', { page_size: 200 }).subscribe((r) => this.categorias.set(r.results));
    this.consultar();
  }

  cambiarTab(t: Tipo): void {
    this.tipo.set(t);
    // limpiar filtros especificos al cambiar de reporte
    this.estado = this.tipoVenta = this.tipoProd = '';
    this.proveedor = this.motivo = this.categoria = this.modulo = '';
    this.consultar();
  }

  private params(): Record<string, string> {
    const p: Record<string, string> = {};
    if (this.tipo() !== 'inventario') {
      p['desde'] = this.desde;
      p['hasta'] = this.hasta;
    }
    switch (this.tipo()) {
      case 'compras':
        if (this.estado) p['estado'] = this.estado;
        if (this.proveedor) p['proveedor'] = this.proveedor;
        break;
      case 'ventas':
        if (this.estado) p['estado'] = this.estado;
        if (this.tipoVenta) p['tipo'] = this.tipoVenta;
        break;
      case 'bajas':
        if (this.estado) p['estado'] = this.estado;
        if (this.motivo) p['motivo'] = this.motivo;
        break;
      case 'ajustes':
        if (this.estado) p['estado'] = this.estado;
        break;
      case 'inventario':
        if (this.tipoProd) p['tipo'] = this.tipoProd;
        if (this.categoria) p['categoria'] = this.categoria;
        break;
      case 'trazabilidad':
        if (this.modulo) p['modulo'] = this.modulo;
        break;
    }
    return p;
  }

  consultar(): void {
    this.cargando.set(true);
    this.datos.set(null);
    this.api.raw<any>(`reportes/${this.tipo()}/`, this.params()).subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  exportar(formato: 'pdf' | 'excel' | 'html'): void {
    this.exportando.set(true);
    this.api.download(`reportes/${this.tipo()}/`, { ...this.params(), formato }).subscribe({
      next: (blob) => {
        const ext = formato === 'excel' ? 'xlsx' : formato;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${this.tipo()}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportando.set(false);
      },
      error: () => this.exportando.set(false),
    });
  }

  get items(): any[] {
    return this.datos()?.items ?? [];
  }
}
