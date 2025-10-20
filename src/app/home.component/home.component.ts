import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home.component',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private router!: Router
  public error = signal<string | null>(null);

  constructor(router: Router) {
    this.router = router;
  }

  public acessarLogin() {
    this.router.navigate(['/login']);
  }
}
