import React, { useState } from 'react';
import { Check, X, Zap, Crown, Star, Loader2, QrCode, Phone, ArrowLeft, FileText } from 'lucide-react';
import { abacatePayService } from '../services/abacatePayService';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
}

interface SelectedPlan {
  id: string;
  name: string;
  price: number;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const [loadingPix, setLoadingPix] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cpf, setCpf] = useState('');

  if (!isOpen) return null;

  // Preços numéricos para AbacatePay
  const PLAN_VALUES = {
    basic: 19.90,
    pro: 39.90,
    studio: 89.90
  };

  const handlePlanSelect = (plan: SelectedPlan) => {
    setSelectedPlan(plan);
  };

  const handleBackToPlans = () => {
    setSelectedPlan(null);
    setPhoneNumber('');
    setCpf('');
  };

  const handlePixCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    
    // Validações básicas
    if (phoneNumber.length < 10) {
      alert("Por favor, insira um número de celular válido com DDD.");
      return;
    }
    
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length < 11) {
       alert("Por favor, insira um CPF válido.");
       return;
    }

    setLoadingPix(true);
    try {
      // Agora enviamos também o CPF
      const url = await abacatePayService.createPixCharge(selectedPlan.price, selectedPlan.name, phoneNumber, cleanCpf);
      window.location.href = url;
    } catch (error) {
      console.error("Erro no Pix:", error);
      alert("Erro ao gerar o Pix: " + (error as Error).message);
      setLoadingPix(false);
    }
  };

  const plans = [
    {
      id: 'basic',
      numericPrice: PLAN_VALUES.basic,
      name: 'Formando',
      credits: 5,
      priceDisplay: 'R$ 19,90',
      features: ['5 Caricaturas', 'Qualidade HD', 'Estilo 3D & 2D', 'Uso Comercial'],
      icon: <Star className="w-6 h-6 text-slate-400" />,
      color: 'from-slate-700 to-slate-800',
      popular: false
    },
    {
      id: 'pro',
      numericPrice: PLAN_VALUES.pro,
      name: 'Orador da Turma',
      credits: 15,
      priceDisplay: 'R$ 39,90',
      features: ['15 Caricaturas', 'Prioridade na Fila', 'Resolução 4K', 'Suporte VIP'],
      icon: <Zap className="w-6 h-6 text-gold-400" />,
      color: 'from-gold-600 to-amber-700',
      popular: true
    },
    {
      id: 'studio',
      numericPrice: PLAN_VALUES.studio,
      name: 'Estúdio Profissional',
      credits: 50,
      priceDisplay: 'R$ 89,90',
      features: ['50 Caricaturas', 'API Access', 'Sem Marca d\'água', 'Arquivos PSD'],
      icon: <Crown className="w-6 h-6 text-purple-400" />,
      color: 'from-purple-600 to-indigo-800',
      popular: false
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-5xl relative my-auto">
        <button 
          onClick={onClose} 
          className="absolute -top-12 right-0 text-slate-400 hover:text-white transition-colors flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full"
        >
          <X size={20} /> Fechar
        </button>

        {/* --- TELA 1: LISTA DE PLANOS --- */}
        {!selectedPlan ? (
          <>
            <div className="text-center mb-10 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Adicione Créditos</h2>
              <p className="text-slate-400 text-lg">Pagamento instantâneo via Pix.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`relative rounded-2xl p-1 bg-gradient-to-b ${plan.popular ? 'from-gold-500 via-amber-500 to-amber-700 shadow-[0_0_40px_rgba(245,158,11,0.2)] transform md:-translate-y-4' : 'from-slate-700 to-slate-800 border border-slate-700'}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold-500 to-amber-600 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      Mais Vendido
                    </div>
                  )}
                  
                  <div className="bg-[#0f131a] rounded-xl p-6 h-full flex flex-col items-center text-center">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${plan.color} bg-opacity-10 mb-4`}>
                      {plan.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-end justify-center gap-1 mb-6">
                      <span className="text-3xl font-bold text-white">{plan.priceDisplay}</span>
                    </div>

                    <div className="w-full space-y-2 mb-8 flex-1">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                          <div className="p-1 rounded-full bg-slate-800 text-gold-500">
                            <Check size={12} />
                          </div>
                          {feature}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePlanSelect({ id: plan.id, name: plan.name, price: plan.numericPrice })}
                      className="w-full py-4 rounded-xl font-bold transition-all bg-[#32BCAD] hover:bg-[#2da89b] text-white shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                    >
                      <QrCode size={20} />
                      <span>Selecionar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* --- TELA 2: INPUT DE DADOS --- */
          <div className="max-w-md mx-auto animate-in slide-in-from-right-8 duration-300">
             <div className="glass-panel p-8 rounded-2xl border border-white/10">
                <button 
                  onClick={handleBackToPlans}
                  className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm"
                >
                  <ArrowLeft size={16} /> Voltar para planos
                </button>

                <div className="text-center mb-8">
                   <div className="w-16 h-16 bg-[#32BCAD]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#32BCAD]/50">
                     <QrCode size={32} className="text-[#32BCAD]" />
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-1">Dados para o Pix</h3>
                   <p className="text-slate-400 text-sm">
                     Plano: <strong className="text-white">{selectedPlan.name}</strong>
                   </p>
                </div>

                <form onSubmit={handlePixCheckout} className="space-y-4">
                   
                   {/* CPF INPUT */}
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} /> CPF (Titular do Pix)
                      </label>
                      <input 
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full glass-input px-4 py-3 rounded-xl text-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-[#32BCAD]/50 border-slate-700"
                        required
                        autoFocus
                      />
                   </div>

                   {/* TELEFONE INPUT */}
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Phone size={14} /> WhatsApp / Celular
                      </label>
                      <input 
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full glass-input px-4 py-3 rounded-xl text-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-[#32BCAD]/50 border-slate-700"
                        required
                      />
                      <p className="text-[10px] text-slate-500">
                        Necessário para validar o pagamento.
                      </p>
                   </div>

                   <button
                    type="submit"
                    disabled={loadingPix}
                    className="w-full py-4 rounded-xl font-bold transition-all bg-[#32BCAD] hover:bg-[#2da89b] text-white shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.02] mt-4"
                  >
                    {loadingPix ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <QrCode size={20} />
                    )}
                    <span>Gerar Pix e Pagar</span>
                  </button>
                </form>
             </div>
          </div>
        )}
        
        <div className="mt-8 text-center flex flex-col items-center gap-2">
           <div className="flex items-center gap-4 justify-center">
             <div className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded text-xs text-slate-400">
                <QrCode size={14} className="text-[#32BCAD]" /> Processado por AbacatePay
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;