import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Permiso, Rol } from '../../core/models';

type RolForm = Partial<Rol> & { permisos_ids?: number[] };

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.html',
})
export class RolesComponent implements OnInit {
  roles = signal<Rol[]>([]);
  permisos = signal<Permiso[]>([]);
  mostrarForm = signal(false);
  modelo: RolForm = this.nuevo();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
    this.api.list<Permiso>('permisos', { page_size: 200 }).subscribe((r) => this.permisos.set(r.results));
  }

  cargar(): void {
    this.api.list<Rol>('roles').subscribe((r) => this.roles.set(r.results));
  }

  /** Agrupa permisos por modulo (prefijo antes del punto). */
  grupos(): { nombre: string; permisos: Permiso[] }[] {
    const mapa = new Map<string, Permiso[]>();
    for (const p of this.permisos()) {
      const modulo = p.codigo.split('.')[0];
      if (!mapa.has(modulo)) mapa.set(modulo, []);
      mapa.get(modulo)!.push(p);
    }
    return [...mapa.entries()].map(([nombre, permisos]) => ({ nombre, permisos }));
  }

  nuevo(): RolForm {
    return { nombre: '', descripcion: '', estado: 'ACTIVO', permisos_ids: [] };
  }

  abrirNuevo(): void {
    this.modelo = this.nuevo();
    this.mostrarForm.set(true);
  }

  editar(r: Rol): void {
    this.modelo = { ...r, permisos_ids: (r.permisos || []).map((p) => p.id) };
    this.mostrarForm.set(true);
  }

  tienePermiso(id: number): boolean {
    return (this.modelo.permisos_ids || []).includes(id);
  }

  alternarPermiso(id: number): void {
    const ids = new Set(this.modelo.permisos_ids || []);
    ids.has(id) ? ids.delete(id) : ids.add(id);
    this.modelo.permisos_ids = [...ids];
  }

  guardar(): void {
    const obs = this.modelo.id
      ? this.api.update<Rol>('roles', this.modelo.id, this.modelo)
      : this.api.create<Rol>('roles', this.modelo);
    obs.subscribe(() => {
      this.mostrarForm.set(false);
      this.cargar();
    });
  }

  eliminar(r: Rol): void {
    this.api.remove('roles', r.id).subscribe(() => this.cargar());
  }
}
