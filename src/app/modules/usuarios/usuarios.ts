import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Rol, Usuario } from '../../core/models';

type UsuarioForm = Partial<Usuario> & { roles_ids?: number[]; password?: string };

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
})
export class UsuariosComponent implements OnInit {
  usuarios = signal<Usuario[]>([]);
  roles = signal<Rol[]>([]);
  buscar = '';
  mostrarForm = signal(false);
  modelo: UsuarioForm = this.nuevo();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
    this.api.list<Rol>('roles').subscribe((r) => this.roles.set(r.results));
  }

  cargar(): void {
    this.api
      .list<Usuario>('usuarios', { buscar: this.buscar })
      .subscribe((r) => this.usuarios.set(r.results));
  }

  nuevo(): UsuarioForm {
    return {
      username: '',
      first_name: '',
      last_name: '',
      correo: '',
      estado: 'ACTIVO',
      password: '',
      roles_ids: [],
    };
  }

  abrirNuevo(): void {
    this.modelo = this.nuevo();
    this.mostrarForm.set(true);
  }

  editar(u: Usuario): void {
    this.modelo = {
      ...u,
      password: '',
      roles_ids: (u.roles || []).map((r) => r.id),
    };
    this.mostrarForm.set(true);
  }

  tieneRol(id: number): boolean {
    return (this.modelo.roles_ids || []).includes(id);
  }

  alternarRol(id: number): void {
    const ids = new Set(this.modelo.roles_ids || []);
    ids.has(id) ? ids.delete(id) : ids.add(id);
    this.modelo.roles_ids = [...ids];
  }

  guardar(): void {
    const body: UsuarioForm = { ...this.modelo };
    if (!body.password) delete body.password; // no reenviar password vacio al editar
    const obs = body.id
      ? this.api.update<Usuario>('usuarios', body.id, body)
      : this.api.create<Usuario>('usuarios', body);
    obs.subscribe(() => {
      this.mostrarForm.set(false);
      this.cargar();
    });
  }

  desactivar(u: Usuario): void {
    this.api.action('usuarios', u.id, 'desactivar').subscribe(() => this.cargar());
  }
}
