import { Component, inject, signal } from '@angular/core';
import { AuthService, UserProfile } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user.register',
  imports: [FormsModule],
  templateUrl: './user.register.component.html',
  styleUrl: './user.register.component.css'
})
export class UserRegisterComponent {
public authService = inject(AuthService);
  public router = inject(Router);
  public registrationSuccess = signal<boolean>(false);
  public password = signal<string>('');

  public profile = signal<UserProfile>({
    fullName: '',
    email: '',
    dob: '',
    cpf: '',
    bio: '',
    city: '',
    parish: '',
    youthGroup: '',
    password:'',
    isAdmin: false
  });

  async register(event: Event): Promise<void> {
    event.preventDefault();
    this.registrationSuccess.set(false);
    this.authService.error.set(null);

    // Validação básica (o AuthService também valida a senha)
    if (!this.password() || this.password().length < 6) {
        this.authService.error.set("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    // 💡 CRIAÇÃO DO OBJETO COMPLETO: Mescla o perfil (que está sendo editado no form)
    // com a senha (que está em um signal separado).
    const completeProfile: UserProfile = {
        ...this.profile(),
        password: this.password(), // Garante que a senha correta seja usada
        isAdmin: false // Define o valor de isAdmin
    };

    try {
      // 💡 Chamada com o objeto completo. O cast 'as any' foi removido.
      await this.authService.registerUser(completeProfile, this.password());

      // Se o cadastro for bem-sucedido (Auth + Firestore)
      this.registrationSuccess.set(true);

      // Após 2 segundos, redireciona para a tela de login
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);

    } catch (error) {
       // O erro é tratado e exibido pelo signal authService.error()
       console.error("Erro no fluxo de registro:", error);
    }
  }
}
