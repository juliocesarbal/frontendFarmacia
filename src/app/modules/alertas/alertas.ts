import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface StockItem {
  producto_id: number;
  codigo: string;
  producto: string;
  tipo: string;
  stock: string;
  umbral: number;
  agotado: boolean;
}

interface VencimientoItem {
  capa_id: number;
  producto_id: number;
  codigo: string;
  producto: string;
  tipo: string;
  cantidad_disponible: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  vencido: boolean;
}

interface AlertasResp {
  stock_critico: StockItem[];
  proximos_vencer: VencimientoItem[];
  resumen: {
    stock_critico: number;
    proximos_vencer: number;
    vencidos: number;
    dias_vencimiento: number;
  };
}

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alertas.html',
})
export class AlertasComponent implements OnInit {
  cargando = signal(false);
  stockCritico = signal<StockItem[]>([]);
  proximosVencer = signal<VencimientoItem[]>([]);
  resumen = signal({ stock_critico: 0, proximos_vencer: 0, vencidos: 0, dias_vencimiento: 30 });

  /** Horizonte de dias para "proximo a vencer" (parametro del backend). */
  dias = 30;

  page = signal(1);
  readonly pageSize = 20;

  total = computed(() => this.stockCritico().length);
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  paginados = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.stockCritico().slice(start, start + this.pageSize);
  });
  desde = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1));
  hasta = computed(() => Math.min(this.page() * this.pageSize, this.total()));

  pageVenc = signal(1);
  totalVenc = computed(() => this.proximosVencer().length);
  totalPaginasVenc = computed(() => Math.max(1, Math.ceil(this.totalVenc() / this.pageSize)));
  paginadosVenc = computed(() => {
    const start = (this.pageVenc() - 1) * this.pageSize;
    return this.proximosVencer().slice(start, start + this.pageSize);
  });
  desdeVenc = computed(() => (this.totalVenc() === 0 ? 0 : (this.pageVenc() - 1) * this.pageSize + 1));
  hastaVenc = computed(() => Math.min(this.pageVenc() * this.pageSize, this.totalVenc()));

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.page.set(1);
    this.pageVenc.set(1);
    this.api.raw<AlertasResp>('reportes/alertas/', { dias: this.dias }).subscribe({
      next: (r) => {
        this.stockCritico.set(r.stock_critico);
        this.proximosVencer.set(r.proximos_vencer || []);
        this.resumen.set(r.resumen);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  anterior(): void {
    if (this.page() > 1) this.page.update((p) => p - 1);
  }

  siguiente(): void {
    if (this.page() < this.totalPaginas()) this.page.update((p) => p + 1);
  }

  anteriorVenc(): void {
    if (this.pageVenc() > 1) this.pageVenc.update((p) => p - 1);
  }

  siguienteVenc(): void {
    if (this.pageVenc() < this.totalPaginasVenc()) this.pageVenc.update((p) => p + 1);
  }
}
