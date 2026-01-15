import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const MESSAGES = [
  "Tirando as medidas virtuais...",
  "Costurando a beca...",
  "Ajustando o capelo na posição perfeita...",
  "Imprimindo o diploma com letras douradas...",
  "Adicionando brilho festivo...",
  "Renderizando texturas em 8K...",
  "Finalizando sua obra de arte...",
  "Preparando para os aplausos...",
];

const LoadingOverlay: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center rounded-2xl border border-gold-500/20">
      <div className="relative">
        <div className="absolute inset-0 bg-gold-500/40 blur-2xl rounded-full animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-gold-500 animate-spin relative z-10" />
      </div>
      <h3 className="mt-8 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-wide animate-pulse">
        Criando Obra de Arte
      </h3>
      <p className="mt-3 text-gold-400/80 text-sm font-medium tracking-wider uppercase">
        {MESSAGES[msgIndex]}
      </p>
    </div>
  );
};

export default LoadingOverlay;