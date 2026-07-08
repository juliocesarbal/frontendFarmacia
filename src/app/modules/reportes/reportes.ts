import { Component, Injector, OnDestroy, OnInit, afterNextRender, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, type ChartConfiguration } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { Categoria, MotivoBaja, Proveedor } from '../../core/models';

Chart.register(...registerables);

type Tipo = 'compras' | 'ventas' | 'bajas' | 'ajustes' | 'inventario' | 'trazabilidad';

/**
 * Paleta categorica institucional (pasos aclarados del guindo/azul UAGRM),
 * validada para banda de luminosidad, croma, separacion CVD y contraste
 * sobre superficie clara. Orden FIJO: el color sigue a la entidad, no al rango.
 */
const PALETA = {
  guindo: '#b04a4e',
  azul: '#3b7bc0',
  ocre: '#b8860b',
  verde: '#2a9d8f',
} as const;

/** Colores fijos por entidad (nunca por posicion en la serie). */
const COLOR_TIPO_PRODUCTO: Record<string, string> = {
  MEDICAMENTO: PALETA.guindo,
  MATERIAL: PALETA.azul,
  INSUMO: PALETA.ocre,
  ESPECIAL: PALETA.verde,
};
const COLOR_TIPO_VENTA: Record<string, string> = {
  VENTA: PALETA.guindo,
  DISPENSACION: PALETA.azul,
};

/** Colores de ESTADO (reservados: nunca se usan como serie categorica). */
const COLOR_ESTADO_STOCK: Record<string, string> = {
  Disponible: '#16a34a',
  Critico: '#d97706',
  Agotado: '#dc2626',
};

const INK_MUTED = '#6b7280';
const GRID = 'rgba(15, 23, 42, 0.06)';

/**
 * Titulos de los paneles de graficos por tab. Se setean ANTES del render (junto
 * con los datos) porque los @if de los canvas dependen de ellos: si se setearan
 * dentro de renderCharts, los canvas de la segunda fila aun no existirian.
 */
const TITULOS_TAB: Record<Tipo, { a: string; b: string; c: string; d: string }> = {
  compras: { a: 'Compras por dia (Bs.)', b: 'Top proveedores (Bs.)', c: '', d: '' },
  ventas: { a: 'Ventas por dia (Bs.)', b: 'Monto por tipo de operacion', c: '', d: '' },
  bajas: { a: 'Bajas registradas por dia', b: 'Bajas por motivo', c: '', d: '' },
  ajustes: { a: 'Ajustes por dia (positivos vs negativos)', b: 'Distribucion por tipo', c: '', d: '' },
  inventario: {
    a: 'Top 10 productos por valor (Bs.)',
    b: 'Valor por tipo de producto',
    c: 'Valor por categoria (Bs.)',
    d: 'Estado del stock (productos)',
  },
  trazabilidad: { a: 'Operaciones por dia', b: 'Operaciones por modulo', c: '', d: '' },
};

function fmtBs(v: number): string {
  return 'Bs. ' + v.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 'YYYY-MM-DD...' -> 'dd/mm' para etiquetas de eje compactas. */
function etiquetaDia(iso: string): string {
  return iso.slice(8, 10) + '/' + iso.slice(5, 7);
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
})
export class ReportesComponent implements OnInit, OnDestroy {
  tipo = signal<Tipo>('compras');
  desde = '';
  hasta = '';
  datos = signal<any>(null);
  cargando = signal(false);
  exportando = signal(false);

  /** Titulos de los paneles de graficos del tab activo (c/d opcionales). */
  titulos = signal<{ a: string; b: string; c: string; d: string }>({
    a: '',
    b: '',
    c: '',
    d: '',
  });

  private charts: Chart[] = [];

  // Filtros segmentables
  estado = '';
  tipoVenta = '';
  tipoProd = '';
  proveedor = '';
  motivo = '';
  categoria = '';
  modulo = '';
  buscar = '';
  estadoStock = '';

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

  constructor(private api: ApiService, private injector: Injector) {
    Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = INK_MUTED;
  }

  ngOnInit(): void {
    // Ventana por defecto de 90 dias: las compras se reponen cada 3-4 meses,
    // con 30 dias el reporte de compras solia quedar vacio.
    const hoy = new Date();
    this.hasta = hoy.toISOString().slice(0, 10);
    this.desde = new Date(hoy.getTime() - 90 * 86400000).toISOString().slice(0, 10);
    this.api.list<Proveedor>('proveedores', { page_size: 200 }).subscribe((r) => this.proveedores.set(r.results));
    this.api.list<MotivoBaja>('motivos-baja', { page_size: 200 }).subscribe((r) => this.motivos.set(r.results));
    this.api.list<Categoria>('categorias', { page_size: 200 }).subscribe((r) => this.categorias.set(r.results));
    this.consultar();
  }

  ngOnDestroy(): void {
    this.destruirCharts();
  }

  cambiarTab(t: Tipo): void {
    this.tipo.set(t);
    // limpiar filtros especificos al cambiar de reporte
    this.estado = this.tipoVenta = this.tipoProd = '';
    this.proveedor = this.motivo = this.categoria = this.modulo = '';
    this.buscar = this.estadoStock = '';
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
        if (this.buscar) p['buscar'] = this.buscar;
        if (this.estadoStock) p['stock'] = this.estadoStock;
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
    this.destruirCharts();
    this.api.raw<any>(`reportes/${this.tipo()}/`, this.params()).subscribe({
      next: (d) => {
        this.datos.set(d);
        this.titulos.set(TITULOS_TAB[this.tipo()]);
        this.cargando.set(false);
        // Dibujar recien DESPUES del proximo ciclo de render de Angular:
        // un setTimeout(0) puede ejecutarse antes de que el @if pinte los
        // <canvas> en el DOM y el grafico quedaria en blanco.
        afterNextRender(
          {
            write: () => {
              try {
                this.renderCharts();
              } catch (e) {
                console.error('Error al dibujar graficos del reporte:', e);
              }
            },
          },
          { injector: this.injector },
        );
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

  // -------------------------------------------------------------------------
  // Graficos interactivos (Chart.js)
  // -------------------------------------------------------------------------

  private destruirCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  /** Agrupa items por dia (YYYY-MM-DD) sumando valorKey, o contando si no hay. */
  private porDia(items: any[], fechaKey: string, valorKey?: string): { labels: string[]; valores: number[] } {
    const mapa = new Map<string, number>();
    for (const it of items) {
      const dia = String(it[fechaKey] ?? '').slice(0, 10);
      if (!dia) continue;
      const v = valorKey ? Number(it[valorKey]) || 0 : 1;
      mapa.set(dia, (mapa.get(dia) || 0) + v);
    }
    const dias = [...mapa.keys()].sort();
    return { labels: dias.map(etiquetaDia), valores: dias.map((d) => mapa.get(d)!) };
  }

  /**
   * Agrupa por un campo categorico (suma valorKey o cuenta), orden descendente,
   * y pliega el excedente de topN en "Otros" (nunca se generan mas hues).
   */
  private porCampo(
    items: any[],
    campo: string,
    valorKey?: string,
    topN = 7,
  ): { labels: string[]; valores: number[] } {
    const mapa = new Map<string, number>();
    for (const it of items) {
      const k = String(it[campo] ?? 'Sin dato');
      const v = valorKey ? Number(it[valorKey]) || 0 : 1;
      mapa.set(k, (mapa.get(k) || 0) + v);
    }
    const orden = [...mapa.entries()].sort((a, b) => b[1] - a[1]);
    const top = orden.slice(0, topN);
    const resto = orden.slice(topN).reduce((s, [, v]) => s + v, 0);
    if (resto > 0) top.push(['Otros', resto]);
    return { labels: top.map(([k]) => k), valores: top.map(([, v]) => v) };
  }

  private opcionesBarra(esMoneda: boolean, horizontal = false): ChartConfiguration<'bar'>['options'] {
    const ejeValor = {
      grid: { color: GRID },
      border: { display: false },
      ticks: {
        callback: (v: unknown) =>
          esMoneda ? Number(v).toLocaleString('es-BO') : String(v),
      },
      beginAtZero: true,
    };
    const ejeCategoria = { grid: { display: false }, border: { display: false } };
    return {
      indexAxis: horizontal ? ('y' as const) : ('x' as const),
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, // una sola serie: el titulo del panel la nombra
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = (horizontal ? ctx.parsed.x : ctx.parsed.y) ?? 0;
              return esMoneda ? fmtBs(v) : `${v}`;
            },
          },
        },
      },
      scales: horizontal ? { x: ejeValor, y: ejeCategoria } : { x: ejeCategoria, y: ejeValor },
    };
  }

  private crearBarra(
    canvasId: string,
    labels: string[],
    valores: number[],
    color: string,
    esMoneda: boolean,
    horizontal = false,
  ): void {
    const el = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!el) return;
    this.charts.push(
      new Chart(el, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              data: valores,
              backgroundColor: color,
              borderRadius: 4, // punta redondeada en el extremo del dato
              barPercentage: 0.7,
              categoryPercentage: 0.8,
              maxBarThickness: 26,
            },
          ],
        },
        options: this.opcionesBarra(esMoneda, horizontal),
      }),
    );
  }

  private crearBarraAgrupada(
    canvasId: string,
    labels: string[],
    series: { nombre: string; valores: number[]; color: string }[],
    esMoneda: boolean,
  ): void {
    const el = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!el) return;
    this.charts.push(
      new Chart(el, {
        type: 'bar',
        data: {
          labels,
          datasets: series.map((s) => ({
            label: s.nombre,
            data: s.valores,
            backgroundColor: s.color,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.75,
            maxBarThickness: 22,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true, // 2+ series: leyenda siempre presente
              position: 'bottom',
              labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  `${ctx.dataset.label}: ${esMoneda ? fmtBs(ctx.parsed.y ?? 0) : ctx.parsed.y ?? 0}`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: GRID }, border: { display: false }, beginAtZero: true },
          },
        },
      }),
    );
  }

  private crearDona(
    canvasId: string,
    labels: string[],
    valores: number[],
    colores: string[],
    esMoneda: boolean,
  ): void {
    const el = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!el) return;
    this.charts.push(
      new Chart(el, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: valores,
              backgroundColor: colores,
              borderColor: '#ffffff', // separador de 2px entre segmentos
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const v = Number(ctx.parsed) || 0;
                  const total = valores.reduce((s, x) => s + x, 0) || 1;
                  const pct = ((v / total) * 100).toFixed(1);
                  return `${ctx.label}: ${esMoneda ? fmtBs(v) : v} (${pct}%)`;
                },
              },
            },
          },
        },
      }),
    );
  }

  private renderCharts(): void {
    this.destruirCharts();
    const items = this.items;
    if (!items.length) return;

    switch (this.tipo()) {
      case 'compras': {
        const dia = this.porDia(items, 'fecha_compra', 'total_compra');
        this.crearBarra('chartA', dia.labels, dia.valores, PALETA.azul, true);
        const prov = this.porCampo(items, 'proveedor__nombre', 'total_compra');
        this.crearBarra('chartB', prov.labels, prov.valores, PALETA.guindo, true, true);
        break;
      }
      case 'ventas': {
        const dia = this.porDia(items, 'fecha_venta', 'total_venta');
        this.crearBarra('chartA', dia.labels, dia.valores, PALETA.azul, true);
        const porTipo = this.porCampo(items, 'tipo_venta', 'total_venta');
        this.crearDona(
          'chartB',
          porTipo.labels,
          porTipo.valores,
          porTipo.labels.map((l) => COLOR_TIPO_VENTA[l] || PALETA.ocre),
          true,
        );
        break;
      }
      case 'bajas': {
        const dia = this.porDia(items, 'fecha_baja');
        this.crearBarra('chartA', dia.labels, dia.valores, PALETA.azul, false);
        const motivo = this.porCampo(items, 'motivo_baja__nombre');
        this.crearBarra('chartB', motivo.labels, motivo.valores, PALETA.guindo, false, true);
        break;
      }
      case 'ajustes': {
        const positivos = items.filter((i) => i.tipo_ajuste === 'POSITIVO');
        const negativos = items.filter((i) => i.tipo_ajuste === 'NEGATIVO');
        const dias = [
          ...new Set(items.map((i) => String(i.fecha_ajuste ?? '').slice(0, 10)).filter(Boolean)),
        ].sort();
        const contarEn = (arr: any[], d: string) =>
          arr.filter((i) => String(i.fecha_ajuste ?? '').slice(0, 10) === d).length;
        this.crearBarraAgrupada(
          'chartA',
          dias.map(etiquetaDia),
          [
            { nombre: 'Positivos', valores: dias.map((d) => contarEn(positivos, d)), color: PALETA.azul },
            { nombre: 'Negativos', valores: dias.map((d) => contarEn(negativos, d)), color: PALETA.guindo },
          ],
          false,
        );
        this.crearDona(
          'chartB',
          ['Positivos', 'Negativos'],
          [positivos.length, negativos.length],
          [PALETA.azul, PALETA.guindo],
          false,
        );
        break;
      }
      case 'inventario': {
        const top = this.porCampo(items, 'nombre', 'valor', 10);
        this.crearBarra('chartA', top.labels, top.valores, PALETA.azul, true, true);
        const porTipo = this.porCampo(items, 'tipo', 'valor');
        this.crearDona(
          'chartB',
          porTipo.labels,
          porTipo.valores,
          porTipo.labels.map((l) => COLOR_TIPO_PRODUCTO[l] || PALETA.ocre),
          true,
        );
        // Valor por categoria (top 7 + Otros)
        const porCat = this.porCampo(items, 'categoria', 'valor');
        this.crearBarra('chartC', porCat.labels, porCat.valores, PALETA.guindo, true, true);
        // Estado del stock: usa el resumen del backend (respeta los filtros)
        const rs = this.datos()?.resumen_stock ?? { DISPONIBLE: 0, CRITICO: 0, AGOTADO: 0 };
        this.crearDona(
          'chartD',
          ['Disponible', 'Critico', 'Agotado'],
          [rs.DISPONIBLE || 0, rs.CRITICO || 0, rs.AGOTADO || 0],
          [
            COLOR_ESTADO_STOCK['Disponible'],
            COLOR_ESTADO_STOCK['Critico'],
            COLOR_ESTADO_STOCK['Agotado'],
          ],
          false,
        );
        break;
      }
      case 'trazabilidad': {
        const dia = this.porDia(items, 'fecha_operacion');
        this.crearBarra('chartA', dia.labels, dia.valores, PALETA.azul, false);
        const mod = this.porCampo(items, 'modulo');
        this.crearBarra('chartB', mod.labels, mod.valores, PALETA.guindo, false, true);
        break;
      }
    }
  }
}
