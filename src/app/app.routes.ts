import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component/dashboard.component';
import { LoginComponent } from './pages/login.component/login.component';
import { ProfileComponent } from './pages/profile.component/profile.component';
import { LoadingComponent } from './pages/loading.component/loading.component';
import { HomeComponent } from './pages/home.component/home.component';
import { UserRegisterComponent } from './pages/user.register.component/user.register.component';
import { ForgotPasswordComponent } from './pages/forgot.password.component/forgot.password.component';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: HomeComponent },
  { path: 'loading', component: LoadingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent},
  { path: 'profile', component: ProfileComponent},
  { path: 'userRegistration', component: UserRegisterComponent},
  { path: 'forgotPassword', component: ForgotPasswordComponent},

  { path: '**', redirectTo: 'home' }
];
