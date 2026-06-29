import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Baja, DetalleBaja, MotivoBaja, Producto } from '../../core/models';

@Component({
  selector: 'app-bajas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bajas.html',
})
export class BajasComponent implements OnInit {
  bajas = signal<Baja[]>([]);
  motivos = signal<MotivoBaja[]>([]);
  productos = signal<Producto[]>([]);
  mostrarForm = signal(false);
  guardando = signal(false);
  error = signal('');

  page = signal(1);
  total = signal(0);
  cargandoLista = signal(false);
  readonly pageSize = 20;

  cabecera: Partial<Baja> = this.nueva();
  detalles = signal<DetalleBaja[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar(1);
    this.api.list<MotivoBaja>('motivos-baja').subscribe((r) => this.motivos.set(r.results));
    this.api.list<Producto>('productos', { estado: 'ACTIVO' }).subscribe((r) => this.productos.set(r.results));
  }

  cargar(p = this.page()): void {
    this.page.set(p);
    this.cargandoLista.set(true);
    this.api.list<Baja>('bajas', { page: p, page_size: this.pageSize }).subscribe((r) => {
      this.bajas.set(r.results);
      this.total.set(r.count);
      this.cargandoLista.set(false);
    });
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

  nueva(): Partial<Baja> {
    return { numero_baja: '', observacion: '' };
  }

  abrirNueva(): void {
    this.cabecera = this.nueva();
    this.detalles.set([this.lineaVacia()]);
    this.error.set('');
    this.mostrarForm.set(true);
  }

  lineaVacia(): DetalleBaja {
    return { producto: 0, cantidad: '0' };
  }

  agregarLinea(): void {
    this.detalles.update((d) => [...d, this.lineaVacia()]);
  }

  quitarLinea(i: number): void {
    this.detalles.update((d) => d.filter((_, idx) => idx !== i));
  }

  totalUnidades(): number {
    return this.detalles().reduce((s, d) => s + Number(d.cantidad), 0);
  }

  guardar(): void {
    if (this.guardando()) return; // evita doble/triple submit
    if (!this.cabecera.motivo_baja) {
      this.error.set('Seleccione un motivo de baja.');
      return;
    }
    this.guardando.set(true);
    this.error.set('');
    const payload = { ...this.cabecera, detalles: this.detalles() };
    this.api.create<Baja>('bajas', payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.cargar(1);
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(e?.error?.detail || 'Error al guardar la baja.');
      },
    });
  }

  confirmar(b: Baja): void {
    this.api.action<Baja>('bajas', b.id, 'confirmar').subscribe({
      next: () => this.cargar(),
      error: (e) => alert(e?.error?.detail || 'No se pudo confirmar.'),
    });
  }

  descargarBoleta(b: Baja): void {
    this.api.download(`bajas/${b.id}/boleta/`, { formato: 'pdf' }).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boleta_baja_${b.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
