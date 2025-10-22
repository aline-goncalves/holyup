import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login.component',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  public authService = inject(AuthService);
  public localEmail = signal<string>('');
  public localPassword = signal<string>('');
  private router = inject(Router);

  async login(event: Event): Promise<void> {
    event.preventDefault();
    await this.authService.signInWithEmailPassword(this.localEmail(), this.localPassword());
  }

  async register(): Promise<void> {
    try {
      await this.authService.signUpWithEmailPassword(this.localEmail(), this.localPassword());
      alert('Cadastro realizado com sucesso! Você será redirecionado.');
    } catch (error) {
    }
  }

  backHome() {
    this.router.navigate(['/home']);
  }

}
