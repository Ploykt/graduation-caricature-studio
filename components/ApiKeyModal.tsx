import React, { useState } from 'react';
import { Key } from 'lucide-react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [keyInput, setKeyInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim().length > 0) {
      onSave(keyInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-gold-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gold-500/10 p-4 rounded-full mb-5 border border-gold-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Key className="w-8 h-8 text-gold-500" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Acesso ao Estúdio</h2>
          <p className="text-slate-400 text-center mt-3 text-sm leading-relaxed">
            Insira sua chave de API para começar. <br/>
            Aceitamos <strong>Google Gemini</strong> (Grátis) ou <strong>OpenAI</strong> (Créditos).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Cole sua chave (AIza... ou sk-...)"
              className="w-full glass-input px-4 py-3.5 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-gold-500/50 transition-all text-center tracking-widest"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-bold py-3.5 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-gold-500/20"
          >
            Entrar no Estúdio
          </button>
        </form>
        <p className="text-[10px] text-slate-600 mt-6 text-center">
          O sistema detecta automaticamente qual provedor usar pelo formato da chave.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyModal;