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

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api
      .list<Bitacora>('trazabilidad', { modulo: this.modulo })
      .subscribe((r) => this.registros.set(r.results));
  }
}
