import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component/dashboard.component';
import { LoginComponent } from './login.component/login.component';
import { ProfileComponent } from './profile.component/profile.component';
import { LoadingComponent } from './loading.component/loading.component';
import { HomeComponent } from './home.component/home.component';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: HomeComponent },
  { path: 'loading', component: LoadingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent},
  { path: 'profile', component: ProfileComponent},

  { path: '**', redirectTo: 'home' }
];
