import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { firebaseConfig as environmentFirebaseConfig } from '../environments/environment';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, getAuth, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class App implements OnInit, OnDestroy {
 // Configuração e Estado de Inicialização do Firebase
  // Usando '!' para indicar que serão inicializadas no ngOnInit,
  // o que previne o erro 500 durante o carregamento do módulo.
  private firebaseApp!: FirebaseApp;
  private db!: Firestore;
  private auth!: Auth;

  // --- ESTADOS DO LOGIN/FORMULÁRIO ---
  public loginEmail = signal<string>('');
  public loginPassword = signal<string>('');
  public isSigningIn = signal<boolean>(false);
  // ------------------------------------

  // Estado da Aplicação (Signals)
  public currentView = signal<AppView>('Loading');
  public userId = signal<string | null>(null);
  public error = signal<string | null>(null);

  /**
   * Garante que o Firebase App seja inicializado apenas uma vez,
   * resolvendo o erro 'app/duplicate-app' de forma mais robusta.
   */
  private initializeFirebaseApp(): FirebaseApp {
    // 1. Verifica se já existe alguma instância do Firebase inicializada.
    if (getApps().length > 0) {
        console.log("Firebase App já inicializado. Retornando instância existente.");
        // Retorna a instância padrão (que deve ser a única no nosso caso)
        return getApp();
    }

    // 2. Se não houver app inicializado, inicializa um novo.
    console.log("Inicializando novo Firebase App.");
    return initializeApp(environmentFirebaseConfig);
  }

  ngOnInit(): void {
    // Inicialização do Firebase movida para ngOnInit
    this.firebaseApp = this.initializeFirebaseApp();
    this.db = getFirestore(this.firebaseApp);
    this.auth = getAuth(this.firebaseApp);

    this.setupFirebaseServices();
  }

  ngOnDestroy(): void {
    // Não há listeners de Firestore para desinscrever, apenas o listener Auth.
  }

  // --- Funções de Navegação e Autenticação ---

  public navigateTo(view: AppView): void {
    console.log(`Navigating to: ${view}`);

    // Removendo a checagem defensiva problemática.
    // Signals definidos em classe devem estar presentes.
    this.error.set(null); // Limpa o erro ao mudar de view
    this.currentView.set(view);
  }

  private setupFirebaseServices(): void {
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    if (initialAuthToken) {
        signInWithCustomToken(this.auth, initialAuthToken).catch(e => {
            console.error("Erro ao autenticar com token customizado:", e);
        });
    }

    // Listener de Estado de Autenticação
    onAuthStateChanged(this.auth, (user) => {
      console.log('onAuthStateChanged fired, User:', user ? user.uid : 'null');
      // Usamos setTimeout(0) para garantir que a navegação ocorra após a conclusão
      // da pilha de execução síncrona atual (resolvendo o erro de contexto).
      setTimeout(() => {
        if (user) {
          this.userId.set(user.uid);
          // O onAuthStateChanged (acima) cuidará da navegação para 'Dashboard'
          this.navigateTo('Dashboard');
        } else {
          this.userId.set(null);
          this.navigateTo('Home');
        }
      }, 0);
    });
  }

  /**
   * Tenta fazer login com E-mail e Senha.
   */
  public async signInWithEmailPassword(event: Event): Promise<void> {
    event.preventDefault(); // Evita o refresh da página
    this.isSigningIn.set(true);
    this.error.set(null);

    const email = this.loginEmail();
    const password = this.loginPassword();

    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      // O onAuthStateChanged (acima) cuidará da navegação para 'Dashboard'
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

  /**
   * Tenta criar uma nova conta com E-mail e Senha.
   */
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
      // O onAuthStateChanged cuidará da navegação para 'Dashboard'
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

  public async logout(): Promise<void> {
    try {
        await this.auth.signOut();
        this.userId.set(null);
        this.navigateTo('Home');
    } catch (e) {
        console.error("Erro ao fazer logout:", e);
        this.error.set("Falha ao sair. Tente novamente.");
    }
  }
}
