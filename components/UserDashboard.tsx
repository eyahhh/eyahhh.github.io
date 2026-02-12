
import React, { useState, useEffect } from 'react';
import { Key, Product } from '../types';
import { Clock, Box, Copy, Check, Loader2, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserDashboardProps {
  activeKey: Key;
  products: Product[];
  onLogout: () => void;
  refreshData: () => Promise<void>;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ activeKey, products, onLogout, refreshData }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [generatedAccount, setGeneratedAccount] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = activeKey.expiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expirado');
        return;
      }
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      setTimeLeft(`${hours > 0 ? hours + 'h ' : ''}${minutes}m`);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeKey]);

  const handleGenerate = async (productId: string) => {
    if (generating) return;
    setGenerating(true);
    setGeneratedAccount(null);
    
    try {
      const { data, error } = await supabase
        .from('stock')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error || !data) {
        alert('Sem estoque disponível no momento.');
        return;
      }

      const { error: deleteError } = await supabase.from('stock').delete().eq('id', data.id);
      if (deleteError) throw deleteError;

      setGeneratedAccount(data.content);
      await refreshData();
    } catch (err) {
      console.error(err);
      alert('Erro técnico ao processar geração.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedAccount) {
      navigator.clipboard.writeText(generatedAccount);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-500 w-6 h-6" />
            <h1 className="text-4xl font-extrabold tracking-tight">NEXUS GEN</h1>
          </div>
          <p className="text-gray-400 font-medium">Seu hub premium de acesso a streaming</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-[#111622] border border-gray-800 px-5 py-2.5 rounded-xl flex items-center space-x-2 text-blue-400 shadow-lg">
            <Clock className="w-4 h-4" /> 
            <span className="font-bold tabular-nums">{timeLeft}</span>
          </div>
          <button 
            onClick={onLogout} 
            className="bg-red-500/10 border border-red-500/20 px-5 py-2.5 rounded-xl text-red-500 hover:bg-red-500/20 transition-all font-bold"
          >
            Sair
          </button>
        </div>
      </header>

      {generatedAccount && (
        <div className="mb-12 animate-in slide-in-from-top-6 duration-500">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Box size={80} />
            </div>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Check className="w-4 h-4" /> Conta Gerada com Sucesso
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <code className="text-2xl md:text-3xl font-mono text-white break-all flex-1 selection:bg-blue-500/40">
                {generatedAccount}
              </code>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={copyToClipboard} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all font-bold shadow-lg shadow-blue-600/20"
                >
                  {copied ? (
                    <><Check className="w-5 h-5" /> Copiado!</>
                  ) : (
                    <><Copy className="w-5 h-5" /> Copiar Dados</>
                  )}
                </button>
                <button 
                  onClick={() => setGeneratedAccount(null)} 
                  className="px-4 py-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="text-gray-400" />
                </button>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500 font-medium">Lembre-se: Não altere os dados da conta para manter a garantia.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="group bg-[#111622] border border-gray-800/50 rounded-3xl p-6 flex flex-col hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5"
          >
            <div className="flex items-center space-x-5 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                {product.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">{product.name}</h3>
                <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-1 font-medium">
                  <Box size={14} className="text-blue-500/60" /> 
                  {product.stock.length} disponíveis
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleGenerate(product.id)}
              disabled={generating || product.stock.length === 0}
              className="w-full py-3.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-600/20 hover:border-blue-500 text-blue-400 hover:text-white disabled:bg-gray-800/50 disabled:text-gray-600 disabled:border-transparent rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group-active:scale-95"
            >
              {generating ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : product.stock.length === 0 ? (
                'Esgotado'
              ) : (
                'Gerar Acesso'
              )}
            </button>
          </div>
        ))}
      </div>
      
      <footer className="mt-16 pt-8 border-t border-gray-800/50 text-center">
        <p className="text-gray-600 text-sm font-medium">
          © 2025 Nexus Gen • Sistema Premium de Gerenciamento
        </p>
      </footer>
    </div>
  );
};

export default UserDashboard;
