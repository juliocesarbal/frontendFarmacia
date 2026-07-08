import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';

interface Acceso {
  ruta: string;
  titulo: string;
  desc: string;
  icono: string;
  permiso?: string;
}

interface StockItem {
  producto_id: number;
  codigo: string;
  producto: string;
  tipo: string;
  stock: string;
  umbral: number;
  agotado: boolean;
}

interface VentaItem {
  id: number;
  numero_boleta: string;
  fecha_venta: string;
  total_venta: string;
  estado: string;
  estado_pago: string;
  estado_entrega: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  productos = signal(0);
  valorInventario = signal(0);
  ventasMes = signal(0);
  stockCriticoTotal = signal(0);
  stockCritico = signal<StockItem[]>([]);
  ultimasVentas = signal<VentaItem[]>([]);
  readonly usuario;

  private readonly todos: Acceso[] = [
    { ruta: '/productos', titulo: 'Productos', desc: 'Medicamentos, materiales e insumos', icono: 'bi-capsule', permiso: 'productos.ver' },
    { ruta: '/compras', titulo: 'Compras', desc: 'Ingresos y capas de costo', icono: 'bi-cart-plus', permiso: 'compras.ver' },
    { ruta: '/ventas', titulo: 'Ventas', desc: 'Dispensaciones y salidas', icono: 'bi-cash-coin', permiso: 'ventas.ver' },
    { ruta: '/inventario', titulo: 'Inventario', desc: 'Existencias por producto', icono: 'bi-box-seam', permiso: 'inventario.ver' },
    { ruta: '/kardex', titulo: 'Kardex valorado', desc: 'PEPS/FIFO por producto', icono: 'bi-journal-text', permiso: 'kardex.ver' },
    { ruta: '/reportes', titulo: 'Reportes', desc: 'Compras, ventas, inventario', icono: 'bi-file-earmark-bar-graph', permiso: 'reportes.ver' },
    { ruta: '/importaciones', titulo: 'Importar Excel', desc: 'Carga de datos historicos', icono: 'bi-file-earmark-arrow-up', permiso: 'importacion.gestionar' },
    { ruta: '/analitica', titulo: 'Analitica', desc: 'Segmentacion K-means', icono: 'bi-graph-up', permiso: 'analitica.ejecutar' },
  ];

  constructor(private api: ApiService, private auth: AuthService) {
    this.usuario = this.auth.usuario;
  }

  get accesos(): Acceso[] {
    return this.todos.filter((a) => !a.permiso || this.auth.tienePermiso(a.permiso));
  }

  rolNombre(): string {
    const u = this.usuario();
    return u?.roles?.[0]?.nombre || (u?.is_superuser ? 'Administrador' : 'Usuario');
  }

  hoy(): string {
    return new Date().toLocaleDateString('es-BO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  ngOnInit(): void {
    // Cada widget consulta solo si el usuario tiene el permiso correspondiente
    // (evita 403 innecesarios para roles de consulta como Contabilidad).
    if (this.auth.tienePermiso('productos.ver')) {
      this.api.list('productos', { page: 1 }).subscribe((r) => this.productos.set(r.count));
    }

    if (this.auth.tienePermiso('reportes.ver')) {
      this.api
        .raw<{ valor_total: number }>('reportes/inventario/')
        .subscribe((r) => this.valorInventario.set(r.valor_total));

      // Ventas entregadas del mes en curso (Bs)
      const hoy = new Date();
      const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
      const hasta = hoy.toISOString().slice(0, 10);
      this.api
        .raw<{ resumen: { total: number; cantidad: number } }>('reportes/ventas/', { desde, hasta })
        .subscribe((r) => this.ventasMes.set(r.resumen?.total || 0));

      // Stock critico (resumen + top 6 para el panel)
      this.api
        .raw<{ stock_critico: StockItem[]; resumen: { stock_critico: number } }>('reportes/alertas/')
        .subscribe((r) => {
          this.stockCritico.set((r.stock_critico || []).slice(0, 6));
          this.stockCriticoTotal.set(r.resumen?.stock_critico || 0);
        });
    }

    // Ultimas ventas
    if (this.auth.tienePermiso('ventas.ver')) {
      this.api
        .list<VentaItem>('ventas', { page: 1, page_size: 6 })
        .subscribe((r) => this.ultimasVentas.set(r.results));
    }
  }
}
