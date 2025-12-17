import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { getSystemUsers } from '../services/dbService';
import { SystemUser } from '../types';

interface LoginProps {
  onLogin: (user: SystemUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const users = getSystemUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

      if (user) {
        onLogin(user);
      } else {
        setError('Email ou senha inválidos.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100">
        
        {/* Header Section */}
        <div className="bg-[#204294] p-10 text-center relative overflow-hidden">
          {/* Decorative Circle */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-[#00B0EA] rounded-full opacity-20 blur-xl"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-[#01B8A1] rounded-full opacity-20 blur-xl"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 flex items-center justify-center w-full">
              {/* CSS Logo Representation for CCM */}
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                 <span className="text-3xl font-extrabold text-white tracking-tight">CCM</span>
                 <div className="h-8 w-px bg-white/30"></div>
                 <span className="text-lg font-light text-white tracking-wide">Smart Time</span>
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium">Gestão de Escalas e Ausências</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">Email Corporativo</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3 top-3 text-slate-400 group-focus-within:text-[#204294] transition-colors" />
                <input 
                  type="email" 
                  required
                  placeholder=""
                  className="w-full border border-slate-200 rounded-lg pl-10 p-2.5 outline-none focus:border-[#204294] focus:ring-1 focus:ring-[#204294] transition-all text-[#1E1E1E] bg-slate-50 focus:bg-white"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">Senha</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3 top-3 text-slate-400 group-focus-within:text-[#204294] transition-colors" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg pl-10 p-2.5 outline-none focus:border-[#204294] focus:ring-1 focus:ring-[#204294] transition-all text-[#1E1E1E] bg-slate-50 focus:bg-white"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-r-lg text-sm flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full bg-[#204294] hover:bg-[#1a367a] text-white p-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                'Autenticando...'
              ) : (
                <>
                  ACESSAR SISTEMA <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400 font-medium">
              CCM Tecnologia &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;