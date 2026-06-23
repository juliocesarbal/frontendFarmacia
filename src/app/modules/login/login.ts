import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  username = '';
  password = '';
  recordar = false;
  error = signal<string>('');
  cargando = signal<boolean>(false);
  verPassword = signal<boolean>(false);

  constructor(private auth: AuthService, private router: Router) {}

  entrar(): void {
    this.error.set('');
    this.cargando.set(true);
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Usuario o contrasena incorrectos.');
      },
    });
  }
}
