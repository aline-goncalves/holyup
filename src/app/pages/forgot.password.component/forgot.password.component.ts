import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './forgot.password.component.html',
  styleUrl: './forgot.password.component.css',
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  public email = signal<string>('');
  public isSending = signal<boolean>(false);
  public successMessage = signal<string | null>(null);
  public errorMessage = signal<string | null>(null);

  public async sendResetLink(): Promise<void> {
    this.isSending.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (!this.email()) {
      this.errorMessage.set('Por favor, digite seu e-mail.');
      this.isSending.set(false);
      return;
    }

    try {
      await this.authService.resetPassword(this.email());
      this.successMessage.set('Link de redefinição enviado com sucesso! Verifique sua caixa de entrada.');
      this.email.set('');

    } catch (error: any) {
      this.errorMessage.set(this.authService.error());

    } finally {
      this.isSending.set(false);
    }
  }
}
