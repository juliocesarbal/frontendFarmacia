import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface MenuItem {
  ruta: string;
  texto: string;
  icono: string;
  permiso?: string;
  grupo: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent {
  private readonly items: MenuItem[] = [
    { ruta: '/dashboard', texto: 'Dashboard', icono: 'bi-speedometer2', grupo: 'General' },
    { ruta: '/productos', texto: 'Productos', icono: 'bi-capsule', permiso: 'productos.ver', grupo: 'Catalogo' },
    { ruta: '/catalogos', texto: 'Categorias y unidades', icono: 'bi-tags', permiso: 'catalogo.gestionar', grupo: 'Catalogo' },
    { ruta: '/proveedores', texto: 'Proveedores', icono: 'bi-truck', permiso: 'proveedores.ver', grupo: 'Catalogo' },
    { ruta: '/compras', texto: 'Compras', icono: 'bi-cart-plus', permiso: 'compras.ver', grupo: 'Operaciones' },
    { ruta: '/ventas', texto: 'Ventas', icono: 'bi-cash-coin', permiso: 'ventas.ver', grupo: 'Operaciones' },
    { ruta: '/bajas', texto: 'Bajas', icono: 'bi-trash3', permiso: 'bajas.ver', grupo: 'Operaciones' },
    { ruta: '/ajustes', texto: 'Ajustes', icono: 'bi-sliders', permiso: 'ajustes.ver', grupo: 'Operaciones' },
    { ruta: '/inventario', texto: 'Inventario', icono: 'bi-box-seam', permiso: 'inventario.ver', grupo: 'Inventario' },
    { ruta: '/kardex', texto: 'Kardex valorado', icono: 'bi-journal-text', permiso: 'kardex.ver', grupo: 'Inventario' },
    { ruta: '/alertas', texto: 'Alertas', icono: 'bi-exclamation-triangle', permiso: 'reportes.ver', grupo: 'Inventario' },
    { ruta: '/reportes', texto: 'Reportes', icono: 'bi-file-earmark-bar-graph', permiso: 'reportes.ver', grupo: 'Analisis' },
    { ruta: '/importaciones', texto: 'Importar Excel', icono: 'bi-file-earmark-arrow-up', permiso: 'importacion.gestionar', grupo: 'Analisis' },
    { ruta: '/analitica', texto: 'Analitica K-means', icono: 'bi-graph-up', permiso: 'analitica.ejecutar', grupo: 'Analisis' },
    { ruta: '/trazabilidad', texto: 'Trazabilidad', icono: 'bi-clock-history', permiso: 'trazabilidad.ver', grupo: 'Analisis' },
    { ruta: '/usuarios', texto: 'Usuarios', icono: 'bi-people', permiso: 'usuarios.ver', grupo: 'Administracion' },
    { ruta: '/roles', texto: 'Roles y permisos', icono: 'bi-shield-lock', permiso: 'roles.ver', grupo: 'Administracion' },
  ];

  readonly grupos = computed(() => {
    const visibles = this.items.filter((i) => !i.permiso || this.auth.tienePermiso(i.permiso!));
    const orden = ['General', 'Catalogo', 'Operaciones', 'Inventario', 'Analisis', 'Administracion'];
    return orden
      .map((g) => ({ nombre: g, items: visibles.filter((i) => i.grupo === g) }))
      .filter((g) => g.items.length > 0);
  });

  readonly usuario;

  constructor(private auth: AuthService, private router: Router) {
    this.usuario = this.auth.usuario;
  }

  iniciales(): string {
    const u = this.usuario();
    if (!u) return '?';
    const a = (u.first_name?.[0] || u.username?.[0] || '').toUpperCase();
    const b = (u.last_name?.[0] || '').toUpperCase();
    return (a + b) || 'U';
  }

  rolNombre(): string {
    const u = this.usuario();
    return u?.roles?.[0]?.nombre || (u?.is_superuser ? 'Administrador' : 'Usuario');
  }

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
