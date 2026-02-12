
import React, { useState } from 'react';
import { Key as KeyIcon, Lock, MessageCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (key: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [keyInput, setKeyInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    onLogin(keyInput.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-auto max-w-md bg-[#111622] rounded-3xl border border-gray-800 shadow-2xl p-8 space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <KeyIcon className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">NEXUS GEN</h1>
          <p className="text-gray-400 font-medium">Insira sua key para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Digite sua key..."
              className="block w-full pl-12 pr-4 py-4 bg-[#0a0c14] border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none placeholder-gray-600 text-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98]"
          >
            Validar Key
          </button>
        </form>

        <button 
          onClick={() => window.open('https://discord.gg', '_blank')}
          className="w-full py-4 border border-gray-800 hover:bg-gray-800/50 text-gray-300 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Junte-se ao Discord</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
