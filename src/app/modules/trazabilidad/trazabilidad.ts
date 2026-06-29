import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface Bitacora {
  id: number;
  modulo: string;
  accion: string;
  entidad: string;
  id_entidad: number;
  usuario_nombre: string;
  fecha_operacion: string;
}

@Component({
  selector: 'app-trazabilidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trazabilidad.html',
})
export class TrazabilidadComponent implements OnInit {
  registros = signal<Bitacora[]>([]);
  modulo = '';

  page = signal(1);
  total = signal(0);
  cargandoLista = signal(false);
  readonly pageSize = 20;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar(1);
  }

  cargar(p = this.page()): void {
    this.page.set(p);
    this.cargandoLista.set(true);
    this.api
      .list<Bitacora>('trazabilidad', {
        modulo: this.modulo,
        page: p,
        page_size: this.pageSize,
      })
      .subscribe({
        next: (r) => {
          this.registros.set(r.results);
          this.total.set(r.count);
          this.cargandoLista.set(false);
        },
        error: () => this.cargandoLista.set(false),
      });
  }

  /** Reinicia a la primera pagina (al cambiar el filtro de modulo). */
  filtrar(): void {
    this.cargar(1);
  }

  totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }
  desde(): number {
    return this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1;
  }
  hasta(): number {
    return Math.min(this.page() * this.pageSize, this.total());
  }
  anterior(): void {
    if (this.page() > 1) this.cargar(this.page() - 1);
  }
  siguiente(): void {
    if (this.page() < this.totalPaginas()) this.cargar(this.page() + 1);
  }
}
