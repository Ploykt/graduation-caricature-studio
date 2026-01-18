import { auth } from "./firebase";

const API_URL = "https://api.abacatepay.com/v1";

export const abacatePayService = {
  /**
   * Cria uma cobrança Pix na AbacatePay
   */
  async createPixCharge(planPrice: number, planName: string, cellphone: string, taxId: string): Promise<string> {
    const apiKey = process.env.VITE_ABACATE_API_KEY;
    const user = auth.currentUser;

    if (!apiKey) throw new Error("Chave da AbacatePay não configurada no .env (VITE_ABACATE_API_KEY).");
    
    const userName = user?.displayName || "Cliente Graduation Studio";
    const userEmail = user?.email || "cliente@graduationstudio.com";

    // Limpa dados (remove caracteres não numéricos)
    const cleanPhone = cellphone.replace(/\D/g, '');
    const cleanTaxId = taxId.replace(/\D/g, '');

    if (!cleanTaxId) throw new Error("CPF/CNPJ é obrigatório para gerar o Pix.");

    // Centavos (R$ 19,90 -> 1990)
    const amountInCents = Math.round(planPrice * 100);
    const returnUrl = window.location.origin + "?payment_provider=abacate&status=success";

    // Payload corrigido com taxId
    const payload = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: planName.toLowerCase().replace(/\s/g, '-'),
          name: `Créditos: ${planName}`,
          quantity: 1,
          price: amountInCents,
        }
      ],
      returnUrl: returnUrl,
      completionUrl: returnUrl,
      customer: {
        name: userName,
        email: userEmail,
        taxId: cleanTaxId, // Campo OBRIGATÓRIO
        cellphone: cleanPhone 
      }
    };

    try {
      console.log("Enviando Payload para AbacatePay:", payload);

      const response = await fetch(`${API_URL}/billing/create`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      
      console.log("Resposta BRUTA AbacatePay:", JSON.stringify(json, null, 2));

      if (!response.ok) {
        // Tenta extrair mensagem de erro detalhada
        const errorMessage = json.error?.message || json.message || JSON.stringify(json.error) || "Erro desconhecido na API";
        throw new Error(`Erro AbacatePay (${response.status}): ${errorMessage}`);
      }

      // Suporte a diferentes formatos de resposta
      const billData = json.data || json;

      if (!billData || !billData.url) {
         console.error("Estrutura JSON inesperada:", json);
         throw new Error("A resposta da API não contém a URL do Pix. Veja o console para detalhes.");
      }

      if (billData.id) {
        localStorage.setItem('pending_abacate_bill', billData.id);
      }
      
      return billData.url;

    } catch (error: any) {
      console.error("Erro fatal no createPixCharge:", error);
      throw error;
    }
  },

  /**
   * Verifica o status de uma cobrança
   */
  async checkBillStatus(billId: string): Promise<boolean> {
    const apiKey = process.env.VITE_ABACATE_API_KEY;
    
    try {
      const response = await fetch(`${API_URL}/billing/list`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });
      
      const json = await response.json();
      const list = json.data || json; 

      if (!Array.isArray(list)) return false;

      const bill = list.find((b: any) => b.id === billId);
      return bill && bill.status === "PAID";
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      return false;
    }
  }
};