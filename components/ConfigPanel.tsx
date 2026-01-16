import React from 'react';
import { UserConfig, ArtStyle, Framing, BackgroundOption, AiProvider } from '../types';
import { GraduationCap, Palette, Frame, User, BookOpen, ImageIcon, Cpu, Sparkles } from 'lucide-react';

interface ConfigPanelProps {
  config: UserConfig;
  onChange: (newConfig: UserConfig) => void;
  disabled: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange, disabled }) => {
  const updateConfig = (key: keyof UserConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-6">
      
      {/* AI Model Provider Selection */}
      <div className="space-y-3 pb-4 border-b border-white/5">
        <label className="flex items-center gap-2 text-gold-400 font-bold text-sm uppercase tracking-wider">
          <Cpu size={16} />
          <span>Motor de Inteligência Artificial</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateConfig('provider', AiProvider.Gemini)}
            disabled={disabled}
            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all relative overflow-hidden ${
              config.provider === AiProvider.Gemini
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.15)]'
                : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 relative z-10">
              <Sparkles size={16} className={config.provider === AiProvider.Gemini ? "text-blue-400" : ""} />
              <span className="font-semibold text-sm">Google Gemini</span>
            </div>
            <span className="text-[10px] opacity-70 relative z-10">Melhor Semelhança (Grátis)</span>
          </button>

          <button
            onClick={() => updateConfig('provider', AiProvider.OpenAI)}
            disabled={disabled}
            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all relative overflow-hidden ${
              config.provider === AiProvider.OpenAI
                ? 'bg-green-600/20 border-green-500 text-white shadow-[0_0_20px_rgba(22,163,74,0.15)]'
                : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
             <div className="flex items-center gap-2 relative z-10">
              <Cpu size={16} className={config.provider === AiProvider.OpenAI ? "text-green-400" : ""} />
              <span className="font-semibold text-sm">OpenAI DALL-E 3</span>
            </div>
            <span className="text-[10px] opacity-70 relative z-10">Alta Criatividade (Pago)</span>
          </button>
        </div>
      </div>

      {/* Course Name */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-gold-400 font-bold text-sm uppercase tracking-wider">
          <BookOpen size={16} />
          <span>Curso / Formação</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={config.courseName}
            onChange={(e) => updateConfig('courseName', e.target.value)}
            placeholder="ex: Enfermagem, Direito, Engenharia..."
            disabled={disabled}
            className="w-full glass-input p-4 pl-12 rounded-xl text-lg font-medium placeholder-slate-500 focus:ring-2 focus:ring-gold-500/50 transition-all border-slate-700"
          />
          <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
        </div>
        <p className="text-xs text-slate-500">Isso adapta a cor da faixa e detalhes do diploma.</p>
      </div>

      {/* Art Style Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-purple-400 font-bold text-sm uppercase tracking-wider">
          <Palette size={16} />
          <span>Estilo Artístico</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateConfig('style', ArtStyle.ThreeD)}
            disabled={disabled}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all relative overflow-hidden group ${
              config.style === ArtStyle.ThreeD
                ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.15)]'
                : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="text-2xl mb-1 relative z-10">🧊</span>
            <span className="font-semibold text-sm relative z-10">3D Estilo Cinema</span>
            {config.style === ArtStyle.ThreeD && (
               <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
            )}
          </button>
          
          <button
            onClick={() => updateConfig('style', ArtStyle.TwoD)}
            disabled={disabled}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all relative overflow-hidden ${
              config.style === ArtStyle.TwoD
                ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.15)]'
                : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="text-2xl mb-1 relative z-10">🎨</span>
            <span className="font-semibold text-sm relative z-10">Pintura Digital</span>
             {config.style === ArtStyle.TwoD && (
               <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
            )}
          </button>
        </div>
      </div>

      {/* Framing Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sky-400 font-bold text-sm uppercase tracking-wider">
          <Frame size={16} />
          <span>Enquadramento</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateConfig('framing', Framing.Portrait)}
            disabled={disabled}
            className={`p-3 rounded-xl border flex items-center justify-center gap-3 transition-all ${
              config.framing === Framing.Portrait
                ? 'bg-sky-600/20 border-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <User size={18} />
            <span className="font-medium text-sm">Retrato (1:1)</span>
          </button>
          
          <button
            onClick={() => updateConfig('framing', Framing.FullBody)}
            disabled={disabled}
            className={`p-3 rounded-xl border flex items-center justify-center gap-3 transition-all ${
              config.framing === Framing.FullBody
                ? 'bg-sky-600/20 border-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Frame size={18} />
            <span className="font-medium text-sm">Corpo Inteiro (9:16)</span>
          </button>
        </div>
      </div>

       {/* Background Selection */}
       <div className="space-y-3">
        <label className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
          <ImageIcon size={16} />
          <span>Fundo / Ambiente</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: BackgroundOption.Studio, label: 'Estúdio', icon: '📸' },
            { id: BackgroundOption.Festive, label: 'Festa', icon: '✨' },
            { id: BackgroundOption.Campus, label: 'Campus', icon: '🏛️' },
          ].map((bg) => (
            <button
              key={bg.id}
              onClick={() => updateConfig('background', bg.id)}
              disabled={disabled}
              className={`p-2 py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                config.background === bg.id
                  ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="text-lg">{bg.icon}</span>
              <span className="font-medium text-xs">{bg.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;