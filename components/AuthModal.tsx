import React, { useState } from 'react';
import { Mail, Lock, X, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Se auth for nulo (erro de config), mostre erro amigável
  if (!auth) {
    return (
       <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-red-500/30 text-center relative">
           <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
             <X size={20} />
           </button>
           <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <h2 className="text-xl font-bold text-white mb-2">Serviço de Login Indisponível</h2>
           <p className="text-slate-400 text-sm">
             O Firebase não foi configurado corretamente. Verifique o arquivo .env e as chaves de API.
           </p>
        </div>
       </div>
    );
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose(); // O listener no App.tsx vai lidar com o estado
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Login cancelado. Tente novamente.");
      } else if (err.code === 'auth/popup-blocked') {
         setError("O pop-up de login foi bloqueado pelo navegador. Permita pop-ups para este site.");
      } else {
        setError("Erro ao conectar com Google. Tente novamente ou use e-mail.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (password.length < 6) {
        throw new Error("A senha deve ter no mínimo 6 caracteres.");
      }

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
      
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Email ou senha incorretos.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Este email já está cadastrado.");
      } else {
        setError(err.message || "Erro ao autenticar.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-white/10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isLogin ? 'Faça login para acessar suas artes' : 'Comece com 3 créditos grátis'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-2 text-left">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white text-slate-800 hover:bg-slate-100 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-md"
            >
              {loading ? (
                 <span className="text-sm">Conectando...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Entrar com Google</span>
                </>
              )}
            </button>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase font-bold">Ou via E-mail</span>
                <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-gold-500/50 transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass-input pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-gold-500/50 transition-all"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-black font-bold py-3 rounded-xl transition-all transform hover:scale-[1.01] shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">Processando...</span>
                ) : isLogin ? (
                  <>
                    <LogIn size={20} /> Entrar
                  </>
                ) : (
                  <>
                    <UserPlus size={20} /> Cadastrar
                  </>
                )}
              </button>
            </form>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-gold-400 text-sm font-medium transition-colors"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem conta? Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;