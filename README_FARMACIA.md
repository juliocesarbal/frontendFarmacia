# Frontend Farmacia — Angular

Interfaz web (Angular 20 + Bootstrap 5 + ng-bootstrap) del Sistema de Gestión
Farmacéutica HEV-UAGRM.

## Requisitos
- Node 20+ y npm
- Backend corriendo en `http://localhost:8000`

## Puesta en marcha
```powershell
npm install        # si no se instalaron las dependencias
npm start          # ng serve -> http://localhost:4200
```

La URL de la API se configura en `src/environments/environment.ts`
(`apiUrl: 'http://localhost:8000/api'`). El archivo `.env` de esta carpeta es
solo documentación: Angular no lo lee en runtime.

## Login de prueba
Tras correr `seed_inicial` en el backend:
- Usuario: `admin`
- Contraseña: `admin123`

## Estructura
```
src/app/
  core/        auth (JWT), interceptors, guards (authGuard, roleGuard), models, services
  layout/      shell (sidebar por permisos + navbar)
  modules/     login, dashboard, productos, proveedores, compras, ventas,
               inventario, kardex, analitica
```

El sidebar oculta automáticamente las opciones para las que el usuario no tiene
permiso. El interceptor agrega el token Bearer y redirige a login ante un 401.

## Nota sobre exportación de Kardex
Los botones Excel/PDF abren el endpoint en una pestaña nueva. Como usan JWT por
header, si el navegador no envía el token conviene migrar a descarga vía
HttpClient con `responseType: 'blob'`. Queda como mejora.
