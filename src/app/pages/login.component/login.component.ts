import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login.component',
  imports: [FormsModule, RouterLink],
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



  backHome() {
    this.router.navigate(['/home']);
  }

}
