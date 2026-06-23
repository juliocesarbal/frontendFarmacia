import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Kardex, Producto } from '../../core/models';

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kardex.html',
})
export class KardexComponent implements OnInit {
  productos = signal<Producto[]>([]);
  kardex = signal<Kardex | null>(null);
  productoId = 0;
  desde = '';
  hasta = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.hasta = hoy.toISOString().slice(0, 10);
    this.desde = new Date(hoy.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    this.api
      .raw<Producto[]>('productos/select/')
      .subscribe((p) => this.productos.set(p));
  }

  consultar(): void {
    if (!this.productoId) return;
    this.api
      .raw<Kardex>(`kardex/producto/${this.productoId}/`, { desde: this.desde, hasta: this.hasta })
      .subscribe((k) => this.kardex.set(k));
  }

  exportar(formato: 'excel' | 'pdf'): void {
    if (!this.productoId) return;
    this.api
      .download(`kardex/producto/${this.productoId}/exportar-${formato}/`, {
        desde: this.desde,
        hasta: this.hasta,
      })
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kardex_${this.productoId}_${this.desde}_${this.hasta}.${
          formato === 'excel' ? 'xlsx' : 'pdf'
        }`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }
}
