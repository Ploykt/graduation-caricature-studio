import React, { useState } from 'react';
import { Download, Share2, Sparkles, ArrowLeft, Check, Wand2, RefreshCcw } from 'lucide-react';

interface ResultDisplayProps {
  imageUrl: string;
  onReset: () => void;
  onRefine: (instruction: string) => void;
  isRefining: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ imageUrl, onReset, onRefine, isRefining }) => {
  const [instruction, setInstruction] = useState('');

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim()) {
      onRefine(instruction);
      setInstruction(''); // Limpa após enviar, mas a UI vai mostrar loading via isRefining
    }
  };

  return (
    <div className="animate-in fade-in zoom-in duration-700 w-full flex flex-col items-center">
      <div className="w-full relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1.5 bg-gradient-to-tr from-gold-500 via-purple-600 to-amber-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-1000 animate-pulse"></div>
        
        <img 
          src={imageUrl} 
          alt="Caricatura de Formatura" 
          className={`relative block w-full rounded-xl shadow-2xl border border-white/10 ${isRefining ? 'opacity-50 blur-sm scale-[0.98]' : ''} transition-all duration-500`}
        />
        
        {isRefining && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
             <RefreshCcw className="w-12 h-12 text-gold-500 animate-spin mb-4" />
             <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur">Aplicando ajustes...</span>
          </div>
        )}
        
        {!isRefining && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-gold-500/30 flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-xs text-gold-100 font-bold uppercase tracking-wider">Estúdio IA</span>
          </div>
        )}
      </div>

      {/* Área de Refinamento */}
      <div className="w-full mt-6 bg-slate-800/50 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
        <label className="text-xs font-bold text-gold-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
          <Wand2 size={14} /> Ajustes Mágicos
        </label>
        <form onSubmit={handleRefineSubmit} className="flex gap-2">
          <input 
            type="text" 
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={isRefining}
            placeholder="Ex: Mude a cor da faixa para azul..."
            className="flex-1 glass-input px-4 py-3 rounded-lg text-sm placeholder-slate-500 focus:ring-1 focus:ring-gold-500/50 border-slate-700"
          />
          <button 
            type="submit"
            disabled={!instruction.trim() || isRefining}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            Refinar
          </button>
        </form>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-lg">
        <button
          onClick={onReset}
          disabled={isRefining}
          className="flex-1 px-6 py-4 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
        >
          <ArrowLeft size={20} />
          Nova Foto
        </button>

        <a 
          href={imageUrl} 
          download={`formatura_caricatura_${Date.now()}.png`}
          className={`flex-[2] px-6 py-4 rounded-xl bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-black font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 ${isRefining ? 'pointer-events-none opacity-50' : ''}`}
        >
          <Download size={20} />
          Baixar Imagem
        </a>
      </div>
      
      <p className="mt-4 text-slate-500 text-xs text-center flex items-center gap-1">
        <Check size={12} className="text-green-500" /> Imagem gerada com sucesso. Salve antes de sair.
      </p>
    </div>
  );
};

export default ResultDisplay;