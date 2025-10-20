import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { firebaseConfig as environmentFirebaseConfig } from '../environments/environment';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, getAuth, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from "@angular/router";
import { Router } from '@angular/router';

// --- Variáveis Globais (MANDATÓRIO USAR) ---
declare const __app_id: string; // Mantido para futuras expansões
declare const __firebase_config: string;
declare const __initial_auth_token: string;

// Definição das Views do PWA simplificada
type AppView = 'Loading' | 'Home' | 'Login' | 'Dashboard';

const firebaseApp = initializeApp(environmentFirebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

@Component({
  selector: 'app-root',
  styles: [],
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class App implements OnInit {
  private firebaseApp!: FirebaseApp;
  private db!: Firestore;
  private auth!: Auth;
  public loginEmail = signal<string>('');
  public loginPassword = signal<string>('');
  public isSigningIn = signal<boolean>(false);
  public currentView = signal<AppView>('Loading');
  public userId = signal<string | null>(null);
  public error = signal<string | null>(null);

  public constructor(private router: Router) {}

  private initializeFirebaseApp(): FirebaseApp {
    if (getApps().length > 0) {
        console.log("Firebase App já inicializado. Retornando instância existente.");
        return getApp();
    }

    console.log("Inicializando novo Firebase App.");
    return initializeApp(environmentFirebaseConfig);
  }

  ngOnInit(): void {
    this.firebaseApp = this.initializeFirebaseApp();
    this.db = getFirestore(this.firebaseApp);
    this.auth = getAuth(this.firebaseApp);

    this.setupFirebaseServices();
  }

  public acessarLogin() {
    this.router.navigate(['/login']);
  }

  public navigateTo(view: AppView): void {
    console.log(`Navigating to: ${view}`);

    this.currentView.set(view);
  }

  private setupFirebaseServices(): void {
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    if (initialAuthToken) {
        signInWithCustomToken(this.auth, initialAuthToken).catch(e => {
            console.error("Erro ao autenticar com token customizado:", e);
        });
    }

    onAuthStateChanged(this.auth, (user) => {
      console.log('onAuthStateChanged fired, User:', user ? user.uid : 'null');
      setTimeout(() => {
        if (user) {
          this.userId.set(user.uid);
          this.navigateTo('Dashboard');
        } else {
          this.userId.set(null);
          this.navigateTo('Home');
        }
      }, 0);
    });
  }

  public async signInWithEmailPassword(event: Event): Promise<void> {
    event.preventDefault();
    this.isSigningIn.set(true);
    this.error.set(null);

    const email = this.loginEmail();
    const password = this.loginPassword();

    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (e: any) {
      console.error("Erro no Login:", e);
      let errorMessage = "Erro de login. Verifique e-mail e senha.";
      if (e.code === 'auth/user-not-found') {
        errorMessage = "Usuário não encontrado.";
      } else if (e.code === 'auth/wrong-password') {
        errorMessage = "Senha incorreta.";
      }
      this.error.set(errorMessage);
    } finally {
      this.isSigningIn.set(false);
    }
  }

  public async signUpWithEmailPassword(): Promise<void> {
    this.isSigningIn.set(true);
    this.error.set(null);

    const email = this.loginEmail();
    const password = this.loginPassword();

    if (!email || !password) {
        this.error.set("Preencha o e-mail e a senha antes de se registrar.");
        this.isSigningIn.set(false);
        return;
    }

    if (password.length < 6) {
        this.error.set("A senha deve ter pelo menos 6 caracteres.");
        this.isSigningIn.set(false);
        return;
    }

    try {
      await createUserWithEmailAndPassword(this.auth, email, password);
      this.error.set("Conta criada com sucesso! Redirecionando...");
    } catch (e: any) {
      console.error("Erro no Registro:", e);
      let errorMessage = "Erro ao criar conta. E-mail já em uso ou inválido.";
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = "Este e-mail já está registrado.";
      }
      this.error.set(errorMessage);
    } finally {
      this.isSigningIn.set(false);
    }
  }


}
