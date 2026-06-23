import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Proveedor } from '../../core/models';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
})
export class ProveedoresComponent implements OnInit {
  proveedores = signal<Proveedor[]>([]);
  buscar = '';
  mostrarForm = signal(false);
  modelo: Partial<Proveedor> = this.nuevo();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api
      .list<Proveedor>('proveedores', { buscar: this.buscar })
      .subscribe((r) => this.proveedores.set(r.results));
  }

  nuevo(): Partial<Proveedor> {
    return { nombre: '', nit: '', telefono: '', correo: '', direccion: '', estado: 'ACTIVO' };
  }

  abrirNuevo(): void {
    this.modelo = this.nuevo();
    this.mostrarForm.set(true);
  }

  editar(p: Proveedor): void {
    this.modelo = { ...p };
    this.mostrarForm.set(true);
  }

  guardar(): void {
    const obs = this.modelo.id
      ? this.api.update<Proveedor>('proveedores', this.modelo.id, this.modelo)
      : this.api.create<Proveedor>('proveedores', this.modelo);
    obs.subscribe(() => {
      this.mostrarForm.set(false);
      this.cargar();
    });
  }

  desactivar(p: Proveedor): void {
    this.api.action('proveedores', p.id, 'desactivar').subscribe(() => this.cargar());
  }
}
