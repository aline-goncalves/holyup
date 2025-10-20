import { Component, signal } from '@angular/core';
import { Route, Router } from '@angular/router';
import { Auth } from 'firebase/auth';

@Component({
  selector: 'app-profile.component',
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  public userId = signal<string | null>(null);
  public error = signal<string | null>(null);
  private auth!: Auth;
  private router!: Router;

  public constructor(router: Router) {}

  public async logout(): Promise<void> {
    try {
        await this.auth.signOut();
        this.userId.set(null);

    } catch (e) {
        console.error("Erro ao fazer logout:", e);
        this.error.set("Falha ao sair. Tente novamente.");
    }
  }

  public acessarHome() {
    this.router.navigate(['/']);
  }

}
