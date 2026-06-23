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
  error = signal('');

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

  ejecutar(): void {
    this.cargando.set(true);
    this.error.set('');
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
}
