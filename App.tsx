import React, { useState, useEffect } from 'react';
import { ArtStyle, Framing, UserConfig, LoadingState } from './types';
import { generateCaricature } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import ConfigPanel from './components/ConfigPanel';
import ResultDisplay from './components/ResultDisplay';
import LoadingOverlay from './components/LoadingOverlay';
import ApiKeyModal from './components/ApiKeyModal';
import { GraduationCap, Wand2, AlertCircle, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  
  const [image, setImage] = useState<string | null>(null);
  const [config, setConfig] = useState<UserConfig>({
    courseName: '',
    style: ArtStyle.ThreeD,
    framing: Framing.Portrait,
  });
  
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check Env
    if (process.env.API_KEY) {
      setApiKey(process.env.API_KEY);
      return;
    }

    // 2. Check Local Storage
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowKeyModal(true);
    }
  }, []);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyModal(false);
    if (errorMsg === "INVALID_KEY") setErrorMsg(null);
  };

  const handleGenerate = async () => {
    if (!image) return;
    if (!config.courseName.trim()) {
      alert("Por favor, digite o nome do curso (ex: Enfermagem)!");
      return;
    }

    setLoadingState('generating');
    setErrorMsg(null);

    try {
      const generatedBase64 = await generateCaricature(apiKey, image, config);
      setResultImage(generatedBase64);
      setLoadingState('success');
    } catch (error: any) {
      console.error(error);
      setLoadingState('error');
      if (error.message === 'INVALID_KEY') {
        setErrorMsg("Chave de API inválida ou expirada.");
        setShowKeyModal(true);
      } else {
        setErrorMsg(error.message || "Algo deu errado. Por favor, tente novamente.");
      }
    }
  };

  const resetFlow = () => {
    setResultImage(null);
    setImage(null);
    setLoadingState('idle');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0B0F19] to-[#0B0F19] flex flex-col items-center py-10 px-4 md:px-8">
      
      {showKeyModal && <ApiKeyModal onSave={handleSaveKey} />}

      {/* Header Premium */}
      <header className="mb-12 text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-semibold tracking-wide uppercase">
          <GraduationCap size={16} />
          <span>Edição Especial Formandos</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
          Eternize sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-amber-600">Conquista</span>
        </h1>
        
        <p className="text-slate-400 text-lg">
          Transforme sua selfie em uma caricatura profissional de formatura digna de um quadro. 
          Perfeito para convites, redes sociais e lembranças.
        </p>

        <div className="flex justify-center gap-4 text-xs text-slate-500 pt-2">
          <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500"/> Alta Resolução (8K)</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500"/> Trajes Oficiais</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500"/> Estúdio 3D ou 2D</span>
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
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-200 flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="flex-shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Right Column: Configuration */}
        {!resultImage && (
          <div className="lg:col-span-5 w-full order-2">
            <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-8 sticky top-8">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gold-500 text-black text-xs font-bold">1</span>
                  Personalize seu Estilo
                </h2>
                <p className="text-sm text-slate-400 pl-8">Defina como será sua arte final.</p>
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
                <p className="text-center text-xs text-slate-500 mt-3">
                  A IA criará uma versão única baseada nos seus traços.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 text-center space-y-2 pb-8 border-t border-white/5 pt-8 w-full max-w-4xl">
        <p className="text-slate-500 text-sm">
          Graduation Studio AI &copy; 2024. Desenvolvido com tecnologia Google Gemini Pro Vision.
        </p>
        <p className="text-slate-600 text-xs">
          Nota: As imagens são geradas por inteligência artificial e podem apresentar variações artísticas.
        </p>
      </footer>
    </div>
  );
};

export default App;