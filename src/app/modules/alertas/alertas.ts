import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface PorVencer {
  capa_id: number;
  producto_id: number;
  codigo: string;
  producto: string;
  lote: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  vencido: boolean;
  cantidad_disponible: string;
  costo_unitario: string;
}

interface StockCritico {
  producto_id: number;
  codigo: string;
  producto: string;
  tipo: string;
  stock: string;
  umbral: number;
  agotado: boolean;
}

interface AlertasResp {
  dias: number;
  por_vencer: PorVencer[];
  stock_critico: StockCritico[];
  resumen: { por_vencer: number; vencidos: number; stock_critico: number };
}

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alertas.html',
})
export class AlertasComponent implements OnInit {
  dias = 30;
  cargando = signal(false);
  porVencer = signal<PorVencer[]>([]);
  stockCritico = signal<StockCritico[]>([]);
  resumen = signal({ por_vencer: 0, vencidos: 0, stock_critico: 0 });

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.api.raw<AlertasResp>('reportes/alertas/', { dias: this.dias }).subscribe({
      next: (r) => {
        this.porVencer.set(r.por_vencer);
        this.stockCritico.set(r.stock_critico);
        this.resumen.set(r.resumen);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
