import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "./firebase";

export const userService = {
  /**
   * Sincroniza o usuário com o Firestore ao fazer login.
   * Se for o primeiro acesso, cria o documento com 3 créditos iniciais.
   */
  async syncUser(uid: string, email: string | null) {
    if (!db) {
       console.warn("Firestore não inicializado. Retornando dados offline.");
       return { credits: 3 };
    }

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Usuário já existe, retorna os dados atuais
        return userSnap.data() as { credits: number };
      } else {
        // Novo usuário: Cria documento com 3 créditos grátis
        const newUserData = {
          email,
          credits: 3,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        await setDoc(userRef, newUserData);
        return newUserData;
      }
    } catch (e) {
      console.error("Erro ao sincronizar usuário no Firestore:", e);
      return { credits: 3 }; // Fallback para erros de rede/permissão
    }
  },

  /**
   * Adiciona ou remove créditos do usuário no Firestore
   */
  async updateCredits(uid: string, amount: number) {
    if (!db) return 0; // Se não tiver DB, não faz nada e retorna 0

    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      credits: increment(amount)
    });
    
    // Retorna o novo saldo para atualizar a UI imediatamente sem precisar de outra chamada
    const updatedSnap = await getDoc(userRef);
    return updatedSnap.data()?.credits || 0;
  }
};