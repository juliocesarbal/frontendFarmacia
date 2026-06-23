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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  productos = signal(0);
  proveedores = signal(0);
  ventas = signal(0);
  valorInventario = signal(0);
  readonly usuario;

  private readonly todos: Acceso[] = [
    { ruta: '/productos', titulo: 'Productos', desc: 'Medicamentos, materiales e insumos', icono: 'bi-capsule' },
    { ruta: '/proveedores', titulo: 'Proveedores', desc: 'Registrar y consultar proveedores', icono: 'bi-truck' },
    { ruta: '/compras', titulo: 'Compras', desc: 'Ingresos y capas de costo', icono: 'bi-cart-plus' },
    { ruta: '/ventas', titulo: 'Ventas', desc: 'Dispensaciones y salidas', icono: 'bi-cash-coin' },
    { ruta: '/inventario', titulo: 'Inventario', desc: 'Existencias por producto', icono: 'bi-box-seam' },
    { ruta: '/kardex', titulo: 'Kardex valorado', desc: 'PEPS/FIFO por producto', icono: 'bi-journal-text', permiso: 'kardex.ver' },
    { ruta: '/reportes', titulo: 'Reportes', desc: 'Compras, ventas, inventario', icono: 'bi-file-earmark-bar-graph', permiso: 'reportes.ver' },
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
    this.api.list('productos', { page: 1 }).subscribe((r) => this.productos.set(r.count));
    this.api.list('proveedores', { page: 1 }).subscribe((r) => this.proveedores.set(r.count));
    this.api.list('ventas', { page: 1 }).subscribe((r) => this.ventas.set(r.count));
    this.api
      .raw<{ valor_total: number }>('reportes/inventario/')
      .subscribe((r) => this.valorInventario.set(r.valor_total));
  }
}
