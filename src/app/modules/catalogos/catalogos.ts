import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Categoria, Unidad } from '../../core/models';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogos.html',
})
export class CatalogosComponent implements OnInit {
  categorias = signal<Categoria[]>([]);
  unidades = signal<Unidad[]>([]);

  mostrarFormCat = signal(false);
  modeloCat: Partial<Categoria> = this.nuevaCat();

  mostrarFormUni = signal(false);
  modeloUni: Partial<Unidad> = this.nuevaUni();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.list<Categoria>('categorias', { page_size: 200 }).subscribe((r) => this.categorias.set(r.results));
    this.api.list<Unidad>('unidades', { page_size: 200 }).subscribe((r) => this.unidades.set(r.results));
  }

  // ---- Categorias ----
  nuevaCat(): Partial<Categoria> {
    return { nombre: '', descripcion: '', estado: 'ACTIVO' };
  }
  abrirNuevaCat(): void {
    this.modeloCat = this.nuevaCat();
    this.mostrarFormCat.set(true);
  }
  editarCat(c: Categoria): void {
    this.modeloCat = { ...c };
    this.mostrarFormCat.set(true);
  }
  guardarCat(): void {
    const obs = this.modeloCat.id
      ? this.api.update<Categoria>('categorias', this.modeloCat.id, this.modeloCat)
      : this.api.create<Categoria>('categorias', this.modeloCat);
    obs.subscribe(() => {
      this.mostrarFormCat.set(false);
      this.cargar();
    });
  }

  // ---- Unidades ----
  nuevaUni(): Partial<Unidad> {
    return { nombre: '', abreviatura: '', estado: 'ACTIVO' };
  }
  abrirNuevaUni(): void {
    this.modeloUni = this.nuevaUni();
    this.mostrarFormUni.set(true);
  }
  editarUni(u: Unidad): void {
    this.modeloUni = { ...u };
    this.mostrarFormUni.set(true);
  }
  guardarUni(): void {
    const obs = this.modeloUni.id
      ? this.api.update<Unidad>('unidades', this.modeloUni.id, this.modeloUni)
      : this.api.create<Unidad>('unidades', this.modeloUni);
    obs.subscribe(() => {
      this.mostrarFormUni.set(false);
      this.cargar();
    });
  }
}
