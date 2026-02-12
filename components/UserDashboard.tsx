
import React, { useState, useEffect } from 'react';
import { Key, Product } from '../types';
import { Clock, Box, Copy, Check, Loader2, Sparkles, X, Gift, AlertCircle } from 'lucide-react';
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
  const [cooldown, setCooldown] = useState(0);

  const COOLDOWN_TIME = 30000;

  useEffect(() => {
    const lastGen = localStorage.getItem('nexus_last_gen');
    if (lastGen) {
      const remaining = parseInt(lastGen) + COOLDOWN_TIME - Date.now();
      if (remaining > 0) setCooldown(Math.ceil(remaining / 1000));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = activeKey.expiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeft('EXPIRADO');
        return;
      }
      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (hours > 100000) setTimeLeft('ILIMITADO');
      else setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    let cooldownTimer: any;
    if (cooldown > 0) {
      cooldownTimer = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    }

    return () => {
      clearInterval(timer);
      if (cooldownTimer) clearInterval(cooldownTimer);
    };
  }, [activeKey, cooldown]);

  const handleGenerate = async (productId: string) => {
    if (generating || cooldown > 0) return;
    setGenerating(true);
    setGeneratedAccount(null);
    
    try {
      // CHAMADA SEGURA VIA RPC (DATABASE SIDE)
      const { data, error } = await supabase.rpc('consume_stock', {
        p_product_id: productId,
        p_key_code: activeKey.code
      });

      if (error) {
        if (error.message.includes('SEM_ESTOQUE')) alert('Este serviço está sem estoque!');
        else if (error.message.includes('KEY_INVALIDA')) alert('Sua key é inválida ou já foi usada!');
        else throw error;
        return;
      }

      // Se sucesso, ativa o cooldown
      localStorage.setItem('nexus_last_gen', Date.now().toString());
      setCooldown(30);
      setGeneratedAccount(data);
      await refreshData();
    } catch (err: any) {
      alert('Erro no Servidor: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white">NEXUS GEN</h1>
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs ml-1">Secure Account Provisioning</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-[#111622] border border-gray-800 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-xl">
            <Clock className="w-5 h-5 text-blue-500" /> 
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase">Tempo de Sessão</p>
              <span className="font-mono text-xl font-black text-blue-400">{timeLeft}</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500/20 transition-all font-black">
            <X size={24} />
          </button>
        </div>
      </header>

      {generatedAccount && (
        <div className="mb-16 animate-in zoom-in duration-500">
          <div className="bg-gradient-to-br from-[#111622] via-[#111622] to-blue-900/10 border border-blue-500/30 rounded-[32px] p-10 backdrop-blur-3xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em]">CONTA CONSUMIDA COM SUCESSO</h3>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 w-full">
                <code className="text-2xl md:text-3xl font-black font-mono text-white break-all block bg-[#0a0c14] border border-gray-800 p-6 rounded-2xl">
                  {generatedAccount}
                </code>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => { navigator.clipboard.writeText(generatedAccount!); setCopied(true); setTimeout(() => setCopied(false), 2000); }} 
                  className="px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all font-black shadow-2xl"
                >
                  {copied ? 'COPIADO' : 'COPIAR'}
                </button>
                <button onClick={() => setGeneratedAccount(null)} className="px-6 py-5 bg-white/5 rounded-2xl border border-gray-800"><X /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product.id} className="group bg-[#111622] border border-gray-800/80 rounded-[40px] p-8 flex flex-col hover:border-blue-500/40 transition-all hover:shadow-2xl">
            <div className="flex items-center space-x-6 mb-10">
              <div className="w-20 h-20 rounded-3xl bg-[#0a0c14] border border-gray-800 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
                {product.icon}
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase">{product.name}</h3>
                <p className="text-gray-500 text-[10px] font-black uppercase mt-2">{product.stock.length} Disponíveis</p>
              </div>
            </div>
            
            <button
              onClick={() => handleGenerate(product.id)}
              disabled={generating || product.stock.length === 0 || cooldown > 0}
              className={`w-full py-5 rounded-[24px] font-black transition-all flex items-center justify-center gap-3 shadow-xl ${
                cooldown > 0 ? 'bg-gray-800 text-gray-500 border border-gray-700' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {generating ? <Loader2 className="animate-spin" /> : cooldown > 0 ? `COOLDOWN ${cooldown}S` : 'GERAR AGORA'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserDashboard;
