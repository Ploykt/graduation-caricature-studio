import React, { useState, useEffect } from 'react';
import { ArtStyle, Framing, BackgroundOption, UserConfig, LoadingState } from './types';
import { generateCaricature } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import ConfigPanel from './components/ConfigPanel';
import ResultDisplay from './components/ResultDisplay';
import LoadingOverlay from './components/LoadingOverlay';
import { GraduationCap, Wand2, AlertCircle, CheckCircle2, Sparkles, KeyRound, Settings, FileCode, Terminal } from 'lucide-react';

const App: React.FC = () => {
  // --- API KEY GATE STATE ---
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Verifica se está rodando localmente
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setIsLocalhost(isLocal);

      try {
        if ((window as any).aistudio) {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setHasAccess(hasKey);
        } else if (process.env.API_KEY) {
          // Se tiver variável de ambiente, libera o acesso
          setHasAccess(true);
        } else {
          // Sem chave e sem AI Studio
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
      // Se clicou no botão mas não tem AI Studio (ambiente local sem .env)
      alert("Ambiente Google AI Studio não detectado.\n\nPara usar sua nova chave:\n1. Crie um arquivo chamado .env na raiz do projeto.\n2. Adicione a linha: API_KEY=SuaChaveAqui\n3. Reinicie o projeto (npm run dev).");
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

  const handleGenerate = async () => {
    if (!image) return;
    if (!config.courseName.trim()) {
      alert("Por favor, digite o nome do curso (ex: Enfermagem)!");
      return;
    }

    setLoadingState('generating');
    setErrorMsg(null);

    try {
      // Cria nova instância a cada chamada para garantir que pegue a chave mais recente selecionada
      const generatedBase64 = await generateCaricature(image, config);

      setResultImage(generatedBase64);
      setLoadingState('success');
    } catch (error: any) {
      console.error(error);
      setLoadingState('error');
      
      const msg = error.message || "";
      
      // Tratamento de erros comuns para orientar o usuário
      if (msg === 'INVALID_KEY' || msg.includes('401') || msg.includes('403') || msg.includes('API key not valid')) {
        setErrorMsg("Chave Inválida. Verifique se a 'Google Generative Language API' está ativada no seu projeto Google Cloud ou se copiou a chave corretamente.");
        setHasAccess(false); 
      } else if (msg.includes('404') || msg.includes('Not Found')) {
         setErrorMsg("Modelo não encontrado ou API não ativada. Verifique se seu projeto Google Cloud tem acesso ao Gemini API.");
      } else if (msg.includes('429') || msg.includes('billing') || msg.includes('RESOURCE_EXHAUSTED')) {
         setErrorMsg("Limite de requisições excedido (Erro 429). Aguarde alguns instantes ou troque de chave.");
      } else {
        setErrorMsg(msg || "Algo deu errado. Por favor, tente novamente.");
      }
    }
  };

  const resetFlow = () => {
    setResultImage(null);
    setImage(null);
    setLoadingState('idle');
    setErrorMsg(null);
  };

  // --- RENDER: LOADING CHECK ---
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F19] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <GraduationCap className="w-12 h-12 text-slate-600" />
           <p className="text-slate-500 font-medium">Verificando acesso ao estúdio...</p>
        </div>
      </div>
    );
  }

  // --- RENDER: API KEY GATE (LANDING) ---
  if (!hasAccess) {
    const showLocalInstructions = isLocalhost && !(window as any).aistudio;

    return (
      <div className="min-h-screen w-full bg-[#0B0F19] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0B0F19] to-[#0B0F19] flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full glass-panel p-8 md:p-10 rounded-3xl text-center space-y-8 border border-gold-500/20 shadow-2xl shadow-black/50 relative overflow-hidden">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gold-500/10 blur-[60px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-gradient-to-br from-slate-800 to-black p-5 rounded-2xl mb-6 border border-slate-700 shadow-lg group">
              <GraduationCap className="w-10 h-10 text-gold-500 group-hover:scale-110 transition-transform duration-500" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Estúdio de Formatura
            </h1>
            
            {!showLocalInstructions ? (
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                 Conecte sua conta Google para gerar caricaturas incríveis.
              </p>
            ) : (
              <div className="text-left bg-slate-900/80 p-6 rounded-xl border border-slate-700 w-full animate-in fade-in slide-in-from-bottom-4">
                 <h3 className="text-gold-400 font-bold flex items-center gap-2 mb-4">
                   <Terminal size={18} />
                   Configuração Necessária
                 </h3>
                 <p className="text-slate-300 text-sm mb-4">
                   Você criou uma chave, mas o app não a encontrou. Para rodar localmente:
                 </p>
                 <ol className="text-xs text-slate-400 space-y-3 list-decimal pl-4">
                   <li className="pl-1">Crie um arquivo chamado <code className="text-green-400 bg-black/50 px-1 py-0.5 rounded">.env</code> na pasta raiz do projeto.</li>
                   <li className="pl-1">Abra o arquivo e cole sua chave assim:
                     <div className="mt-2 bg-black/50 p-3 rounded-lg border border-slate-800 font-mono text-slate-300 flex items-center gap-2">
                       <FileCode size={14} className="text-blue-400" />
                       API_KEY=AIzaSy...
                     </div>
                   </li>
                   <li className="pl-1">Pare o terminal e rode <code className="text-white">npm run dev</code> novamente.</li>
                 </ol>
              </div>
            )}
          </div>
          
          <div className="space-y-4 relative z-10">
            {/* Se estiver no AI Studio, mostra botão do Google. Se estiver local sem chave, o botão é um fallback */}
            {!showLocalInstructions && (
              <button 
                onClick={requestAccess}
                className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-black shadow-lg shadow-amber-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <KeyRound size={20} />
                <span>Conectar Google API</span>
              </button>
            )}

            <div className="text-[10px] text-slate-500 px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <p>Dica: Certifique-se que a <strong>Generative Language API</strong> está ativada no seu projeto Google Cloud.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APP ---
  return (
    <div className="min-h-screen w-full bg-[#0B0F19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0B0F19] to-[#0B0F19] flex flex-col items-center py-10 px-4 md:px-8 animate-in fade-in duration-700 relative">
      
      {/* 1. Botão Flutuante Superior Direito (Sempre visível) */}
      <div className="absolute top-4 right-4 z-50">
          {(window as any).aistudio && (
            <button 
              onClick={requestAccess}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-gold-500/50 text-xs font-semibold text-slate-300 hover:text-white transition-all backdrop-blur-md shadow-lg"
            >
              <KeyRound size={14} className="text-gold-500" />
              <span className="hidden sm:inline">Alterar API Key</span>
              <span className="sm:hidden">API</span>
            </button>
          )}
      </div>

      {/* Header Premium */}
      <header className="mb-12 text-center space-y-4 max-w-2xl mx-auto mt-8 md:mt-0">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-semibold tracking-wide uppercase">
          <GraduationCap size={16} />
          <span>Edição Especial Formandos</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
          Eternize sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-amber-600">Conquista</span>
        </h1>
        
        <p className="text-slate-400 text-lg">
          Transforme sua selfie em uma caricatura profissional de formatura digna de um quadro. 
        </p>

        <div className="flex justify-center gap-4 text-xs text-slate-500 pt-2">
          <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500"/> Alta Resolução</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500"/> Trajes Oficiais</span>
          <span className="flex items-center gap-1"><Sparkles size={12} className="text-blue-400"/> Powered by Google Gemini</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Result or Upload */}
        <div className={`lg:col-span-7 w-full transition-all duration-500 ${resultImage ? 'order-1' : 'order-1'}`}>
          {resultImage ? (
            <ResultDisplay imageUrl={resultImage} onReset={resetFlow} />
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
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-200 flex flex-col md:flex-row items-center gap-3 animate-in slide-in-from-top-2 border-l-4 border-l-red-500">
              <AlertCircle className="flex-shrink-0 w-6 h-6" />
              <div className="flex-1">
                <p className="text-sm font-bold">Erro na Geração</p>
                <p className="text-xs opacity-90 mt-1">{errorMsg}</p>
              </div>
              
              {/* Se o erro for de chave e estiver no AI Studio, mostra botão. Se for local, sugere .env */}
              {(errorMsg.includes('Chave') || errorMsg.includes('Cota')) && (window as any).aistudio && (
                <button 
                  onClick={requestAccess}
                  className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg border border-red-500/30 transition-colors whitespace-nowrap font-semibold"
                >
                  Trocar Conta
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Configuration */}
        {!resultImage && (
          <div className="lg:col-span-5 w-full order-2">
            <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-8 sticky top-8">
              
              {/* Header do Painel */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gold-500 text-black text-xs font-bold">1</span>
                    Personalize seu Estilo
                  </h2>
                  <p className="text-sm text-slate-400 pl-8">Defina como será sua arte final.</p>
                </div>
                
                {/* Botão de Configuração (Apenas visual se não tiver função específica além do requestAccess) */}
                {(window as any).aistudio && (
                  <button 
                     onClick={requestAccess}
                     className="p-2 text-slate-500 hover:text-gold-500 transition-colors rounded-lg hover:bg-white/5"
                     title="Alterar Chave API Google"
                  >
                    <Settings size={18} />
                  </button>
                )}
              </div>

              <ConfigPanel 
                config={config} 
                onChange={setConfig} 
                disabled={loadingState === 'generating'} 
              />

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={handleGenerate}
                  disabled={!image || !config.courseName || loadingState === 'generating'}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
                    !image || !config.courseName || loadingState === 'generating'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-black shadow-amber-900/20 transform hover:scale-[1.02] hover:shadow-xl'
                  }`}
                >
                  {loadingState === 'generating' ? (
                    <span>Processando no Estúdio...</span>
                  ) : (
                    <>
                      <Wand2 size={24} className="text-black" />
                      <span>Gerar Minha Caricatura</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 text-center space-y-4 pb-8 border-t border-white/5 pt-8 w-full max-w-4xl">
        <div className="flex justify-center gap-4 text-sm text-slate-500">
           <p>Graduation Studio AI &copy; 2024</p>
           {(window as any).aistudio && (
             <button onClick={requestAccess} className="hover:text-gold-500 transition-colors underline decoration-slate-700 hover:decoration-gold-500">
               Configurar Chave Google
             </button>
           )}
        </div>
      </footer>
    </div>
  );
};

export default App;