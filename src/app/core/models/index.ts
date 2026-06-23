// Modelos / interfaces del dominio farmacia.

export interface Usuario {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  correo: string;
  estado: string;
  is_active: boolean;
  is_superuser: boolean;
  roles: Rol[];
  permisos: string[];
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  permisos: Permiso[];
}

export interface Permiso {
  id: number;
  codigo: string;
  descripcion: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  usuario: Usuario;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
}

export interface Unidad {
  id: number;
  nombre: string;
  abreviatura: string;
  estado: string;
}

export interface Producto {
  id: number;
  codigo_producto: string;
  nombre: string;
  descripcion: string;
  tipo_producto: string;
  precio_venta: string;
  costo_referencial: string;
  stock_minimo: string;
  estado: string;
  categoria: number;
  categoria_nombre?: string;
  unidad_medida: number;
  unidad_nombre?: string;
  stock_actual?: number;
}

export interface Proveedor {
  id: number;
  nombre: string;
  nit: string;
  telefono: string;
  correo: string;
  direccion: string;
  estado: string;
}

export interface DetalleCompra {
  id?: number;
  producto: number;
  producto_nombre?: string;
  unidad_medida?: number;
  cantidad: string;
  costo_unitario: string;
  costo_total?: string;
  numero_lote?: string;
  fecha_vencimiento?: string;
  observacion?: string;
}

export interface Compra {
  id: number;
  numero_orden: string;
  numero_factura: string;
  fecha_compra: string;
  estado: string;
  total_compra: string;
  observacion: string;
  proveedor: number;
  proveedor_nombre?: string;
  detalles: DetalleCompra[];
}

export interface DetalleVenta {
  id?: number;
  producto: number;
  producto_nombre?: string;
  cantidad: string;
  precio_unitario: string;
  subtotal?: string;
  costo_total_salida?: string;
}

export interface Venta {
  id: number;
  numero_boleta: string;
  fecha_venta: string;
  tipo_venta: string;
  estado: string;
  total_venta: string;
  observacion: string;
  detalles: DetalleVenta[];
}

export interface Lote {
  id: number;
  cantidad_inicial: string;
  cantidad_disponible: string;
  costo_unitario: string;
  fecha_ingreso: string;
  origen: string;
  estado: string;
  numero_lote: string;
  fecha_vencimiento: string | null;
  documento: string;
}

export interface InventarioItem {
  id: number;
  producto: number;
  codigo_producto: string;
  producto_nombre: string;
  tipo_producto: string;
  cantidad_actual: string;
  costo_referencial: string;
  stock_minimo: string;
}

export interface KardexFila {
  fecha: string;
  tipo: string;
  concepto: string;
  documento: string;
  costo_unitario: string;
  entrada_cantidad: string;
  entrada_valor: string;
  salida_cantidad: string;
  salida_valor: string;
  saldo_cantidad: string;
  saldo_valor: string;
}

export interface Kardex {
  producto: { id: number; codigo: string; nombre: string; unidad: string };
  desde: string;
  hasta: string;
  saldo_inicial_cantidad: string;
  saldo_inicial_valor: string;
  saldo_final_cantidad: string;
  saldo_final_valor: string;
  filas: KardexFila[];
  verificacion_capas?: { cantidad: string; valor: string; coincide: boolean };
}

export interface MotivoBaja {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
}

export interface DetalleBaja {
  id?: number;
  producto: number;
  producto_nombre?: string;
  capa?: number | null;
  cantidad: string;
  costo_total_baja?: string;
  observacion?: string;
}

export interface Baja {
  id: number;
  numero_baja: string;
  fecha_baja: string;
  estado: string;
  observacion: string;
  motivo_baja: number;
  motivo_nombre?: string;
  detalles: DetalleBaja[];
}

export interface DetalleAjuste {
  id?: number;
  producto: number;
  producto_nombre?: string;
  cantidad: string;
  costo_unitario?: string;
  costo_total?: string;
  observacion?: string;
}

export interface Ajuste {
  id: number;
  numero_ajuste: string;
  fecha_ajuste: string;
  tipo_ajuste: string;
  estado: string;
  motivo: string;
  observacion: string;
  detalles: DetalleAjuste[];
}

export interface ImportacionDetalle {
  id: number;
  numero_fila: number;
  datos_originales: Record<string, string | null>;
  estado_fila: string;
  mensaje_error: string;
}

export interface Importacion {
  id: number;
  tipo_importacion: string;
  nombre_archivo: string;
  estado: string;
  total_registros: number;
  registros_validos: number;
  registros_observados: number;
  fecha_importacion: string;
  detalles?: ImportacionDetalle[];
}

export interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
