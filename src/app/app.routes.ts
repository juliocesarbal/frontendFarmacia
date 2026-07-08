import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./modules/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./modules/productos/productos').then((m) => m.ProductosComponent),
        data: { permiso: 'productos.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'proveedores',
        loadComponent: () =>
          import('./modules/proveedores/proveedores').then((m) => m.ProveedoresComponent),
        data: { permiso: 'proveedores.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'compras',
        loadComponent: () =>
          import('./modules/compras/compras').then((m) => m.ComprasComponent),
        data: { permiso: 'compras.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./modules/ventas/ventas').then((m) => m.VentasComponent),
        data: { permiso: 'ventas.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'bajas',
        loadComponent: () => import('./modules/bajas/bajas').then((m) => m.BajasComponent),
        data: { permiso: 'bajas.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'ajustes',
        loadComponent: () => import('./modules/ajustes/ajustes').then((m) => m.AjustesComponent),
        data: { permiso: 'ajustes.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./modules/inventario/inventario').then((m) => m.InventarioComponent),
        data: { permiso: 'inventario.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'reportes',
        loadComponent: () => import('./modules/reportes/reportes').then((m) => m.ReportesComponent),
        data: { permiso: 'reportes.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'importaciones',
        loadComponent: () =>
          import('./modules/importaciones/importaciones').then((m) => m.ImportacionesComponent),
        data: { permiso: 'importacion.gestionar' },
        canActivate: [roleGuard],
      },
      {
        path: 'trazabilidad',
        loadComponent: () =>
          import('./modules/trazabilidad/trazabilidad').then((m) => m.TrazabilidadComponent),
        data: { permiso: 'trazabilidad.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'kardex',
        loadComponent: () =>
          import('./modules/kardex/kardex').then((m) => m.KardexComponent),
        data: { permiso: 'kardex.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'alertas',
        loadComponent: () =>
          import('./modules/alertas/alertas').then((m) => m.AlertasComponent),
        data: { permiso: 'reportes.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'analitica',
        loadComponent: () =>
          import('./modules/analitica/analitica').then((m) => m.AnaliticaComponent),
        data: { permiso: 'analitica.ejecutar' },
        canActivate: [roleGuard],
      },
      {
        path: 'catalogos',
        loadComponent: () =>
          import('./modules/catalogos/catalogos').then((m) => m.CatalogosComponent),
        data: { permiso: 'catalogo.gestionar' },
        canActivate: [roleGuard],
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./modules/usuarios/usuarios').then((m) => m.UsuariosComponent),
        data: { permiso: 'usuarios.ver' },
        canActivate: [roleGuard],
      },
      {
        path: 'roles',
        loadComponent: () => import('./modules/roles/roles').then((m) => m.RolesComponent),
        data: { permiso: 'roles.ver' },
        canActivate: [roleGuard],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
