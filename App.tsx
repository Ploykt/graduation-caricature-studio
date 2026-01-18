import React, { useState, useEffect } from 'react';
import { ArtStyle, Framing, BackgroundOption, UserConfig, LoadingState } from './types';
import { generateCaricature } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import ConfigPanel from './components/ConfigPanel';
import ResultDisplay from './components/ResultDisplay';
import LoadingOverlay from './components/LoadingOverlay';
import AuthModal from './components/AuthModal';
import PricingModal from './components/PricingModal';
import Gallery from './components/Gallery';
import { GraduationCap, Wand2, AlertCircle, Sparkles, LogOut, User as UserIcon, Coins, CheckCircle2 } from 'lucide-react';
import { localDb } from './services/localDb';
import { userService } from './services/userService'; 
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { abacatePayService } from './services/abacatePayService';

const App: React.FC = () => {
  // --- USER & CREDITS STATE ---
  const [user, setUser] = useState<User | null>(null); 
  const [credits, setCredits] = useState<number>(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | null>(null);

  // --- API KEY GATE STATE ---
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);

  // 0. VERIFICAÇÃO DE PAGAMENTO (ABACATE PAY & STRIPE)
  useEffect(() => {
    const processPayment = async () => {
        // Verifica se há pagamentos pendentes
        const pendingBillId = localStorage.getItem('pending_abacate_bill');
        const params = new URLSearchParams(window.location.search);
        const isAbacateReturn = params.get('payment_provider') === 'abacate';
        
        // Se temos um bill ID e o usuário está logado, verificamos o status
        if (pendingBillId && user) {
             console.log("Verificando status do Pix:", pendingBillId);
             const isPaid = await abacatePayService.checkBillStatus(pendingBillId);
             
             if (isPaid) {
                 const storedCredits = localStorage.getItem('pending_abacate_credits');
                 const creditsToAdd = storedCredits ? parseInt(storedCredits, 10) : 0;
                 
                 if (creditsToAdd > 0) {
                     try {
                        console.log(`Pagamento confirmado. Adicionando ${creditsToAdd} créditos para ${user.uid}`);
                        await userService.updateCredits(user.uid, creditsToAdd);
                        setPaymentStatus('success');
                        alert(`Pagamento confirmado! ${creditsToAdd} créditos foram adicionados à sua conta.`);
                     } catch (err) {
                        console.error("Erro ao adicionar créditos:", err);
                        alert("Houve um erro ao creditar sua conta. Entre em contato com o suporte.");
                     }
                 }
                 
                 // Limpeza
                 localStorage.removeItem('pending_abacate_bill');
                 localStorage.removeItem('pending_abacate_credits');
                 
                 // Limpa URL
                 if (isAbacateReturn) {
                    window.history.replaceState({}, '', window.location.pathname);
                 }
                 
                 setTimeout(() => setPaymentStatus(null), 5000);
             } else {
                 console.log("Pix ainda não consta como pago.");
             }
        }
        
        // Verifica Stripe (Legacy)
        if (params.get('payment_success') === 'true' && !params.get('payment_provider')) {
          setPaymentStatus('success');
          window.history.replaceState({}, '', window.location.pathname);
          setTimeout(() => setPaymentStatus(null), 5000);
        }
    };

    // Executa verificação sempre que o usuário carrega (login) ou volta para a página
    if (user) {
        processPayment();
    }
  }, [user]); // Dependência crucial: user. Sem user, não processa.

  // 1. Check API Key for Gemini
  useEffect(() => {
    const checkAccess = async () => {
      try {
        if ((window as any).aistudio) {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setHasAccess(hasKey);
        } else if (process.env.API_KEY) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Erro ao verificar API Key:", error);
      } finally {
        setIsCheckingAccess(false);
      }
    };
    checkAccess();
  }, []);

  // 2. Initialize DB & Auth Listener
  useEffect(() => {
    const initApp = async () => {
      await localDb.init(); 
      
      if (!auth) {
        console.log("Modo Offline: Firebase Auth não disponível.");
        setCredits(3);
        return;
      }

      const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          try {
            await userService.syncUser(currentUser.uid, currentUser.email);
            if (db) {
              const userRef = doc(db, "users", currentUser.uid);
              const unsubDocs = onSnapshot(userRef, (doc) => {
                 if (doc.exists()) {
                   setCredits(doc.data().credits || 0);
                 }
              });
              return () => unsubDocs();
            }
          } catch (error) {
            console.error("Erro ao sincronizar usuário:", error);
          }
        } else {
          setCredits(0);
        }
      });

      return () => unsubscribeAuth();
    };
    initApp();
  }, []);

  const requestAccess = async () => {
    if ((window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        setHasAccess(true);
        window.location.reload();
      } catch (e) {
        console.error("Seleção de chave cancelada ou falhou", e);
      }
    } else {
      alert("Ambiente Google AI Studio não detectado.");
    }
  };

  // --- APP STATE ---
  const [image, setImage] = useState<string | null>(null);
  const [config, setConfig] = useState<UserConfig>({
    courseName: '',
    style: ArtStyle.ThreeD,
    framing: Framing.Portrait,
    background: BackgroundOption.Festive,
  });
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  // --- HANDLERS ---
  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    resetFlow();
  };

  const executeGeneration = async (refinementInstruction?: string) => {
     if (auth && !user) {
        setShowAuthModal(true);
        return;
      }
  
      if (credits <= 0) {
        setShowPricingModal(true);
        return;
      }
  
      if (!image) return;
      if (!config.courseName.trim()) {
        alert("Por favor, digite o nome do curso!");
        return;
      }

      if (refinementInstruction) {
          setIsRefining(true);
      } else {
          setLoadingState('generating');
      }
      
      setErrorMsg(null);
  
      try {
        const generatedBase64 = await generateCaricature(image, config, refinementInstruction);
  
        if (user && auth) {
          await userService.updateCredits(user.uid, -1);
          const configToSave = refinementInstruction 
            ? { ...config, refinement: refinementInstruction }
            : config;
          await localDb.saveToHistory(user.uid, generatedBase64, configToSave);
        } else {
           setCredits(prev => prev - 1);
        }
        
        setResultImage(generatedBase64);
        setLoadingState('success');
      } catch (error: any) {
        console.error(error);
        setLoadingState('error');
        setErrorMsg(error.message || "Algo deu errado.");
      } finally {
          setIsRefining(false);
      }
  };

  const handleGenerate = () => executeGeneration();
  const handleRefine = (instruction: string) => executeGeneration(instruction);

  const resetFlow = () => {
    setResultImage(null);
    setImage(null);
    setLoadingState('idle');
    setErrorMsg(null);
    setIsRefining(false);
  };

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F19] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <GraduationCap className="w-12 h-12 text-slate-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0B0F19] to-[#0B0F19] flex flex-col items-center py-10 px-4 md:px-8 animate-in fade-in duration-700 relative">
      
      {/* ALERTS */}
      {paymentStatus === 'success' && (
        <div className="fixed top-24 z-50 animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div>
              <p className="font-bold">Pagamento Confirmado!</p>
              <p className="text-xs opacity-80">Seus créditos foram creditados.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} onSelectPlan={() => setShowPricingModal(false)} />

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 p-4 md:px-8 flex justify-between items-center z-40 bg-gradient-to-b from-[#0B0F19] to-transparent">
        <div className="flex items-center gap-2 text-gold-500 font-bold tracking-tight">
          <GraduationCap size={24} />
          <span className="hidden sm:inline">Graduation Studio</span>
        </div>

        <div className="flex items-center gap-4">
           {!hasAccess && (
             <button onClick={requestAccess} className="text-xs text-red-400 border border-red-500/30 px-2 py-1 rounded-md bg-red-500/10">
               ! API Key
             </button>
           )}

           {/* --- BOTÃO PLANOS SOLICITADO --- */}
           {/* Aparece sempre, para que o usuário possa ver os preços antes ou depois de logar */}
           <button 
             onClick={() => setShowPricingModal(true)}
             className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-white transition-all backdrop-blur-md"
           >
             <Coins size={16} className="text-gold-500" />
             Planos
           </button>

           {user ? (
             <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur-md p-1.5 pr-4 rounded-full border border-slate-700">
               {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gold-500/50" />
               ) : (
                  <div className="bg-gradient-to-br from-gold-500 to-amber-600 w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs">
                    {user.email?.substring(0,2).toUpperCase() || 'U'}
                  </div>
               )}
               
               <div className="flex flex-col">
                 <span className="text-xs text-slate-400 leading-none mb-0.5">Créditos</span>
                 <span className="text-white font-bold text-sm leading-none">{credits}</span>
               </div>
               <div className="h-4 w-[1px] bg-slate-600 mx-1"></div>
               <button onClick={handleLogout} className="text-slate-400 hover:text-white" title="Sair">
                 <LogOut size={16} />
               </button>
             </div>
           ) : (
             <button 
               onClick={() => {
                 if (auth) setShowAuthModal(true);
                 else alert("Login indisponível.");
               }}
               className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-black text-sm font-bold transition-all shadow-lg"
             >
               <UserIcon size={16} />
               {auth ? "Entrar" : "Demo"}
             </button>
           )}
        </div>
      </div>

      {/* Header Premium */}
      <header className="mb-12 text-center space-y-4 max-w-2xl mx-auto mt-16 md:mt-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
          Eternize sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-amber-600">Conquista</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Transforme sua selfie em uma caricatura profissional.
        </p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Column: Result or Upload */}
        <div className={`lg:col-span-7 w-full transition-all duration-500 ${resultImage ? 'order-1' : 'order-1'}`}>
          {resultImage ? (
            <ResultDisplay 
                imageUrl={resultImage} 
                onReset={resetFlow} 
                onRefine={handleRefine}
                isRefining={isRefining}
            />
          ) : (
            <div className="relative">
              {loadingState === 'generating' && <LoadingOverlay />}
              <ImageUploader 
                onImageSelected={setImage} 
                selectedImage={image} 
                onClear={() => setImage(null)} 
              />
            </div>
          )}
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-200 flex flex-col items-start gap-3 animate-in slide-in-from-top-2 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3 w-full">
                <AlertCircle className="flex-shrink-0 w-6 h-6" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Erro na Geração</p>
                  <p className="text-xs opacity-90 mt-1">{errorMsg}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Configuration */}
        {!resultImage && (
          <div className="lg:col-span-5 w-full order-2">
            <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-8 sticky top-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gold-500 text-black text-xs font-bold">1</span>
                    Personalize seu Estilo
                  </h2>
                </div>
              </div>

              <ConfigPanel config={config} onChange={setConfig} disabled={loadingState === 'generating'} />

              <div className="pt-4 border-t border-white/5 space-y-3">
                {user && credits === 0 && (
                   <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200 flex items-center gap-2 mb-2">
                     <AlertCircle size={14} />
                     Você não tem créditos suficientes.
                   </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loadingState === 'generating'}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
                    loadingState === 'generating'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-black shadow-amber-900/20 transform hover:scale-[1.02] hover:shadow-xl'
                  }`}
                >
                  {loadingState === 'generating' ? (
                    <span>Processando...</span>
                  ) : !user && auth ? (
                    <>
                      <UserIcon size={24} className="text-black" />
                      <span>Entrar para Gerar</span>
                    </>
                  ) : credits <= 0 ? (
                     <>
                      <Sparkles size={24} className="text-black" />
                      <span>Comprar Créditos</span>
                     </>
                  ) : (
                    <>
                      <Wand2 size={24} className="text-black" />
                      <span>Gerar (1 Crédito)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {user && (
        <div className="w-full max-w-6xl z-10">
          <Gallery userId={user.uid} />
        </div>
      )}

      <footer className="mt-24 text-center space-y-4 pb-8 border-t border-white/5 pt-8 w-full max-w-4xl z-10">
        <div className="flex justify-center gap-4 text-sm text-slate-500">
           <p>Graduation Studio AI &copy; 2024</p>
           <span className="text-amber-500/50 text-xs px-2 border border-amber-500/20 rounded">Auth: Firebase | Credits: Cloud | Images: Local</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
