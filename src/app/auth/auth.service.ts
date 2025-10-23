import { Injectable, signal, inject } from '@angular/core';
import { signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
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
      console.error("Erro no Registro:", e);
      let errorMessage = "Erro desconhecido durante o registro.";

      switch (e.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Este e-mail já está registrado.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Formato de e-mail inválido.";
          break;
        case 'auth/weak-password':
          errorMessage = "A senha deve ter pelo menos 6 caracteres.";
          break;
        case 'permission-denied':
          errorMessage = "Falha ao salvar o perfil do usuário. (Verifique as Regras do Firestore)";
          break;
        default:
          errorMessage = e.code ? `Erro de Autenticação: ${e.code}` : "Erro de conexão ou servidor.";
      }

      this.error.set(errorMessage);
      throw new Error("Falha no fluxo de registro: " + errorMessage);

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
        const userCredential = await createUserWithEmailAndPassword(this.auth, profile.email, password);
        const uid = userCredential.user.uid;
        const { password: _, ...profileDataToSave } = profile;

        await this.firestoreService.saveUserProfile(uid, profileDataToSave);
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
        throw e;
    } finally {
        this.isSigningIn.set(false);
    }
  }

  /**
   * Envia o link de redefinição de senha para o e-mail fornecido.
   * Este é o método que o ForgotPasswordComponent usa.
   * @param email O e-mail do usuário.
   */
  public async resetPassword(email: string): Promise<void> {
    this.error.set(null);
    this.isSigningIn.set(true); // Reutilizamos este flag como 'isSending'

    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (e: any) {
      console.error("Erro ao solicitar reset de senha:", e);
      let errorMessage = "Erro desconhecido ao tentar enviar o link.";

      switch (e.code) {
        case 'auth/user-not-found':
          errorMessage = "O e-mail não corresponde a nenhum usuário registrado.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Formato de e-mail inválido.";
          break;
        default:
          errorMessage = "Não foi possível enviar o e-mail. Tente novamente.";
      }

      this.error.set(errorMessage);
      throw new Error(errorMessage);

    } finally {
      this.isSigningIn.set(false);
    }
  }
}
