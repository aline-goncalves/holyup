import { Injectable, signal, inject } from '@angular/core';
import { signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { FirestoreService } from './firestore.service';

export interface UserProfile {
  fullName: string;
  email: string;
  dob: string; // Data de Nascimento
  cpf: string;
  bio: string;
  city: string;
  parish: string; // Paróquia
  youthGroup: string; // Grupo de Jovens
  password: string;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private router = inject(Router);
  public userId = signal<string | null>(null);
  public isSigningIn = signal<boolean>(false);
  public error = signal<string | null>(null);
  private firestore = inject(Firestore);
  private firestoreService = inject(FirestoreService);

  constructor() {
    this.setupAuthStateListener();
    this.initialCustomTokenLogin();
  }

  private setupAuthStateListener(): void {
    onAuthStateChanged(this.auth, (user) => {
      console.log('onAuthStateChanged fired, User:', user ? user.uid : 'null');

      setTimeout(() => {
        if (user) {
          this.userId.set(user.uid);
          this.router.navigate(['/profile']);
        } else {
          this.userId.set(null);

          if (this.router.url !== '/login') {
            this.router.navigate(['/home']);
          }
        }
      }, 0);
    });
  }

  private initialCustomTokenLogin(): void {
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    if (initialAuthToken) {
      signInWithCustomToken(this.auth, initialAuthToken).catch(e => {
        console.error("Erro ao autenticar com token customizado:", e);
      });
    }
  }

  public async signInWithEmailPassword(email: string, password: string): Promise<void> {
    this.isSigningIn.set(true);
    this.error.set(null);

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
      throw new Error(errorMessage);
    } finally {
      this.isSigningIn.set(false);
    }
  }

  public async signUpWithEmailPassword(email: string, password: string): Promise<void> {
    this.isSigningIn.set(true);
    this.error.set(null);

    if (password.length < 6) {
      const errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      this.error.set(errorMessage);
      this.isSigningIn.set(false);
      throw new Error(errorMessage);
    }

    try {
      await createUserWithEmailAndPassword(this.auth, email, password);

    } catch (e: any) {
      console.error("Erro no Registro:", e);
      let errorMessage = "Erro ao criar conta. E-mail já em uso ou inválido.";

      if (e.code === 'auth/email-already-in-use') {
        errorMessage = "Este e-mail já está registrado.";
      }

      this.error.set(errorMessage);
      throw new Error(errorMessage);

    } finally {
      this.isSigningIn.set(false);
    }
  }

  public async logout(): Promise<void> {
    this.error.set(null);
    try {
      await signOut(this.auth);

    } catch (e: any) {
      console.error("Erro ao fazer logout:", e);
      this.error.set("Falha ao sair. Tente novamente.");
    }
  }

  /**
   * Realiza o registro de um novo usuário no Firebase Auth e salva o perfil no Firestore.
   * @param profile O objeto de perfil completo (incluindo password temporariamente para tipagem).
   * @param password A senha clara para o Firebase Auth.
   */
  public async registerUser(profile: UserProfile, password: string): Promise<void> {
    this.isSigningIn.set(true);
    this.error.set(null);

    try {
        // 1. Firebase Auth: Registrar usuário com email e senha
        const userCredential = await createUserWithEmailAndPassword(this.auth, profile.email, password);
        const uid = userCredential.user.uid;

        // 2. Preparar Dados do Perfil para Firestore
        // 🚨 CRÍTICO: Remova a senha antes de salvar no Firestore por motivos de segurança.
        // O campo 'password' é removido usando desestruturação, pois só era necessário
        // para o Firebase Auth e a tipagem temporária.
        const { password: _, ...profileDataToSave } = profile;

        // 3. Firestore: Salvar dados adicionais do perfil
        await this.firestoreService.saveUserProfile(uid, profileDataToSave);

        // Sucesso - o listener onAuthStateChanged cuidará do redirecionamento
        this.error.set(null);

    } catch (e: any) {
        console.error("Erro no Registro:", e);
        let errorMessage = "Erro ao criar conta. Verifique os dados.";

        if (e.code === 'auth/email-already-in-use') {
            errorMessage = "Este e-mail já está registrado.";
        } else if (e.code === 'auth/weak-password') {
            errorMessage = "A senha é muito fraca (mínimo de 6 caracteres).";
        } else if (e.code === 'auth/invalid-email') {
            errorMessage = "O formato do e-mail é inválido.";
        }

        this.error.set(errorMessage);
        throw e; // Re-throw para permitir que o componente de registro capture o erro
    } finally {
        this.isSigningIn.set(false);
    }
  }
}
