import { inject, Injectable } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

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
export class FirestoreService {
  private db: Firestore = inject(Firestore);
  private appId: string = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  /**
   * Salva os dados do perfil do usuário no Firestore após a autenticação.
   * O documento é criado no caminho público: /artifacts/{appId}/public/data/user_profiles/{uid}
   * @param uid O ID do usuário fornecido pelo Firebase Auth.
   * @param profileData Os dados do perfil a serem salvos (sem a senha).
   */
  public async saveUserProfile(uid: string, profileData: Omit<UserProfile, 'password'>): Promise<void> {
    const appPath = `artifacts/${this.appId}`;

    // Caminho da Collection: /artifacts/{appId}/public/data/user_profiles
    const profilesCollectionPath = `${appPath}/public/data/user_profiles`;

    // Referência do Documento: /artifacts/{appId}/public/data/user_profiles/{uid}
    const profileDocRef = doc(this.db, profilesCollectionPath, uid);

    try {
      console.log(`Salvando perfil para UID: ${uid} no caminho: ${profileDocRef.path}`);

      // O setDoc sobrescreve ou cria o documento.
      await setDoc(profileDocRef, {
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Perfil salvo com sucesso no Firestore.");

    } catch (error) {
      console.error("Erro ao salvar perfil no Firestore:", error);
      throw new Error("Falha ao salvar o perfil do usuário.");
    }
  }
}
