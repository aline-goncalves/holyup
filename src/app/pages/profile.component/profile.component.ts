import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-profile.component',
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  public authService = inject(AuthService);

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
