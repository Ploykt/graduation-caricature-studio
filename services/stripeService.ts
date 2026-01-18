import { addDoc, collection, onSnapshot, doc } from "firebase/firestore";
import { db, auth } from "./firebase";

export const stripeService = {
  /**
   * Cria uma sessão de checkout usando a Extensão do Firebase "Run Payments with Stripe".
   */
  async createCheckoutSession(priceId: string): Promise<void> {
    if (!auth.currentUser || !db) throw new Error("Usuário não autenticado.");

    const userId = auth.currentUser.uid;
    const sessionsRef = collection(db, "customers", userId, "checkout_sessions");

    // 1. Cria o documento de intenção de compra
    const docRef = await addDoc(sessionsRef, {
      price: priceId,
      success_url: window.location.origin + "?payment_success=true",
      cancel_url: window.location.origin + "?payment_canceled=true",
      mode: "payment", 
      metadata: {
        type: "credits_purchase", 
        uid: userId
      }
    });

    // 2. Ouve o documento aguardando a Extensão escrever a URL
    return new Promise((resolve, reject) => {
      // Timeout de segurança (15 segundos)
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error("Timeout: O servidor de pagamento demorou para responder. Verifique se a Extensão Stripe está instalada no Firebase."));
      }, 15000);

      const unsubscribe = onSnapshot(docRef, (snap) => {
        const { error, url } = snap.data() || {};
        
        if (error) {
          clearTimeout(timeoutId);
          unsubscribe();
          reject(new Error(`An error occurred: ${error.message}`));
        }
        
        if (url) {
          clearTimeout(timeoutId);
          unsubscribe();
          // 3. Redireciona o usuário para o Stripe
          window.location.assign(url);
          resolve();
        }
      });
    });
  }
};