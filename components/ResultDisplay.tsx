import React from 'react';
import { Download, Share2, Sparkles, ArrowLeft, Check } from 'lucide-react';

interface ResultDisplayProps {
  imageUrl: string;
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ imageUrl, onReset }) => {
  return (
    <div className="animate-in fade-in zoom-in duration-700 w-full flex flex-col items-center">
      <div className="w-full relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1.5 bg-gradient-to-tr from-gold-500 via-purple-600 to-amber-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-1000 animate-pulse"></div>
        
        <img 
          src={imageUrl} 
          alt="Caricatura de Formatura" 
          className="relative block w-full rounded-xl shadow-2xl border border-white/10"
        />
        
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-gold-500/30 flex items-center gap-1.5 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span className="text-xs text-gold-100 font-bold uppercase tracking-wider">Estúdio IA</span>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-lg">
        <button
          onClick={onReset}
          className="flex-1 px-6 py-4 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <ArrowLeft size={20} />
          Criar Nova
        </button>

        <a 
          href={imageUrl} 
          download={`formatura_caricatura_${Date.now()}.png`}
          className="flex-[2] px-6 py-4 rounded-xl bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-black font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
        >
          <Download size={20} />
          Baixar Alta Resolução
        </a>
      </div>
      
      <p className="mt-4 text-slate-500 text-xs text-center flex items-center gap-1">
        <Check size={12} className="text-green-500" /> Imagem gerada com sucesso. Salve antes de sair.
      </p>
    </div>
  );
};

export default ResultDisplay;