import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

interface ProductoCluster {
  codigo: string;
  nombre: string;
  rotacion: string;
  consumo_total: string;
  costo_total: string;
  stock_actual: string;
}
interface Cluster {
  numero_cluster: number;
  nombre_cluster: string;
  descripcion: string;
  productos: ProductoCluster[];
}
interface Ejecucion {
  id: number;
  numero_clusters: number;
  periodo_inicio?: string;
  periodo_fin?: string;
  fecha_ejecucion?: string;
  variables_usadas?: string[];
  clusters: Cluster[];
}

@Component({
  selector: 'app-analitica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analitica.html',
})
export class AnaliticaComponent {
  k = 4;
  resultado = signal<Ejecucion | null>(null);
  cargando = signal(false);
  exportando = signal(false);
  error = signal('');
  /** Texto de busqueda por cluster (numero_cluster -> query). */
  filtros = signal<Record<number, string>>({});

  constructor(private api: ApiService) {}

  private readonly colores = [
    '#731A1B', '#004f91', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d',
  ];

  color(i: number): string {
    return this.colores[i % this.colores.length];
  }

  maxProductos(): number {
    const c = this.resultado()?.clusters ?? [];
    return Math.max(1, ...c.map((x) => x.productos.length));
  }

  totalProductos(): number {
    return (this.resultado()?.clusters ?? []).reduce((s, c) => s + c.productos.length, 0);
  }

  // ----- Busqueda por cluster -----
  buscar(c: Cluster): string {
    return this.filtros()[c.numero_cluster] ?? '';
  }

  setBuscar(c: Cluster, q: string): void {
    this.filtros.update((f) => ({ ...f, [c.numero_cluster]: q }));
  }

  productosFiltrados(c: Cluster): ProductoCluster[] {
    const q = this.buscar(c).toLowerCase().trim();
    if (!q) return c.productos;
    return c.productos.filter(
      (p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q),
    );
  }

  // ----- Metricas por cluster -----
  promRotacion(c: Cluster): number {
    if (!c.productos.length) return 0;
    return c.productos.reduce((s, p) => s + Number(p.rotacion), 0) / c.productos.length;
  }

  sumaConsumo(c: Cluster): number {
    return c.productos.reduce((s, p) => s + Number(p.consumo_total), 0);
  }

  sumaCosto(c: Cluster): number {
    return c.productos.reduce((s, p) => s + Number(p.costo_total), 0);
  }

  porcentaje(c: Cluster): number {
    const t = this.totalProductos();
    return t ? (c.productos.length / t) * 100 : 0;
  }

  ejecutar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.filtros.set({});
    this.api
      .create<Ejecucion>('analitica/kmeans/ejecutar', { k: this.k })
      .pipe(timeout(120000)) // si cuelga >2min, libera el boton en vez de quedar trabado
      .subscribe({
        next: (r) => {
          this.resultado.set(r);
          this.cargando.set(false);
        },
        error: (e) => {
          this.error.set(
            e?.error?.detail || 'Error o tiempo agotado al ejecutar K-means. Reintenta.',
          );
          this.cargando.set(false);
        },
      });
  }

  exportar(): void {
    const r = this.resultado();
    if (!r) return;
    this.exportando.set(true);
    this.api.download(`analitica/kmeans/${r.id}/exportar/`).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `segmentacion_kmeans_${r.id}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportando.set(false);
      },
      error: () => this.exportando.set(false),
    });
  }
}
