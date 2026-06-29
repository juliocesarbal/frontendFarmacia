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

interface AlertasResp {
  stock_critico: StockItem[];
  resumen: { stock_critico: number };
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
  resumen = signal({ stock_critico: 0 });

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

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.page.set(1);
    this.api.raw<AlertasResp>('reportes/alertas/').subscribe({
      next: (r) => {
        this.stockCritico.set(r.stock_critico);
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
}
