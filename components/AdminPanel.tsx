
import React, { useState, useEffect } from 'react';
import { Key, Product, StockHistoryEntry } from '../types.ts';
import { 
  Trash2, 
  ArrowLeft, 
  PlusCircle, 
  AlertCircle, 
  History as HistoryIcon, 
  Loader2, 
  Package, 
  Settings, 
  Database,
  RefreshCw,
  X,
  Terminal,
  Copy,
  Check,
  Zap,
  Clock,
  ShieldAlert,
  Search,
  FileText,
  Play
} from 'lucide-react';
import { supabase } from '../lib/supabase.ts';

interface AdminPanelProps {
  keys: Key[];
  products: Product[];
  history: StockHistoryEntry[];
  refreshData: () => Promise<void>;
  onExit: () => void;
  dbStatus: 'OK' | 'ERROR';
}

type Tab = 'KEYS' | 'PRODUCTS' | 'AUDIT' | 'SETUP' | 'TEST';

const AdminPanel: React.FC<AdminPanelProps> = ({ keys, products, history, refreshData, onExit, dbStatus }) => {
  const [activeTab, setActiveTab] = useState<Tab>(dbStatus === 'ERROR' ? 'SETUP' : 'KEYS');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  
  const [keyTime, setKeyTime] = useState(24);
  const [expiryUnit, setExpiryUnit] = useState('hours');
  const [keyCount, setKeyCount] = useState(1);
  const [newProductName, setNewProductName] = useState('');
  const [newProductIcon, setNewProductIcon] = useState('✨');
  const [stockInput, setStockInput] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  const sqlCode = `-- SCRIPT DE CORREÇÃO NUCLEAR (DELETE FIX)

-- 1. Garante permissão total para as tabelas (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

-- 2. Recriar Políticas com WITH CHECK (Necessário para DELETE/UPDATE)
DROP POLICY IF EXISTS "Acesso_Total_Produtos" ON public.products;
CREATE POLICY "Acesso_Total_Produtos" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso_Total_Estoque" ON public.stock;
CREATE POLICY "Acesso_Total_Estoque" ON public.stock FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso_Total_Keys" ON public.keys;
CREATE POLICY "Acesso_Total_Keys" ON public.keys FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso_Total_Historico" ON public.stock_history;
CREATE POLICY "Acesso_Total_Historico" ON public.stock_history FOR ALL USING (true) WITH CHECK (true);

-- 3. Função de Consumo Atômico (Mantida)
CREATE OR REPLACE FUNCTION public.consume_stock(p_product_id UUID, p_key_code TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_content TEXT; v_stock_id UUID; v_key_id UUID;
BEGIN
  SELECT id INTO v_key_id FROM public.keys WHERE code = p_key_code AND (used = false OR code = 'adminkey777') AND expires_at > now() LIMIT 1;
  IF v_key_id IS NULL AND p_key_code != 'adminkey777' THEN RAISE EXCEPTION 'KEY_INVALIDA'; END IF;
  SELECT id, content INTO v_stock_id, v_content FROM public.stock WHERE product_id = p_product_id ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF v_stock_id IS NULL THEN RAISE EXCEPTION 'SEM_ESTOQUE'; END IF;
  INSERT INTO public.stock_history (product_id, content, key_used) VALUES (p_product_id, v_content, p_key_code);
  DELETE FROM public.stock WHERE id = v_stock_id;
  IF p_key_code != 'adminkey777' THEN UPDATE public.keys SET used = true, used_at = now() WHERE id = v_key_id; END IF;
  RETURN v_content;
END; $$;`;

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza? Isso apagará o serviço e TODO o estoque dele!')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (e: any) {
      alert(`Erro ao deletar produto: ${e.message}\nCertifique-se de que aplicou o SQL de permissão.`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteKey = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('keys').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (e: any) {
      alert(`Erro ao deletar key: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTestGenerate = async (productId: string) => {
    setLoading(true);
    setTestOutput(null);
    try {
      const { data, error } = await supabase.rpc('consume_stock', {
        p_product_id: productId,
        p_key_code: 'adminkey777'
      });
      if (error) throw error;
      setTestOutput(data);
      await refreshData();
    } catch (e: any) {
      alert("Erro no teste: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="flex items-center space-x-6">
          <button onClick={onExit} className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-2xl border border-gray-700 transition-all">
            <ArrowLeft />
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">Nexus Dev Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${dbStatus === 'OK' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
              <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Server {dbStatus === 'OK' ? 'Synced' : 'Error'}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex bg-[#111622] p-1.5 rounded-2xl border border-gray-800 overflow-x-auto scrollbar-none">
          {[
            { id: 'KEYS', label: 'Chaves', icon: <Zap size={14}/> },
            { id: 'PRODUCTS', label: 'Serviços', icon: <Package size={14}/> },
            { id: 'TEST', label: 'Testar', icon: <Play size={14}/> },
            { id: 'AUDIT', label: 'Auditoria', icon: <FileText size={14}/> },
            { id: 'SETUP', label: 'SQL Setup', icon: <Terminal size={14}/> }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)} 
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'TEST' && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[32px] flex items-center gap-4">
            <ShieldAlert className="text-blue-500" size={32} />
            <div>
              <h3 className="font-black text-sm uppercase text-blue-400">Ambiente de Simulação</h3>
              <p className="text-blue-200/60 text-xs">Aqui você pode testar a entrega de contas sem queimar chaves de clientes. Toda ação gera um log na auditoria.</p>
            </div>
          </div>

          {testOutput && (
            <div className="bg-[#111622] border border-green-500/30 p-10 rounded-[40px] animate-bounce-short">
               <p className="text-[10px] font-black text-green-500 uppercase mb-4 tracking-widest">Conta Entregue:</p>
               <code className="text-2xl font-mono font-black text-white block bg-black/40 p-6 rounded-2xl border border-gray-800">{testOutput}</code>
               <button onClick={() => setTestOutput(null)} className="mt-4 text-gray-500 text-[10px] font-black uppercase hover:text-white transition-all">Limpar Resultado</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
              <div key={product.id} className="bg-[#111622] border border-gray-800 p-8 rounded-[40px] flex flex-col justify-between hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-4xl">{product.icon}</span>
                  <div>
                    <h4 className="font-black uppercase text-lg">{product.name}</h4>
                    <p className="text-[10px] text-gray-500 font-black uppercase">{product.stock.length} Disponíveis</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleTestGenerate(product.id)}
                  disabled={loading || product.stock.length === 0}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Play size={14}/> Testar Entrega</>}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'SETUP' && (
        <div className="space-y-10 animate-in zoom-in duration-300">
           <div className="bg-[#111622] border border-orange-500/20 rounded-[40px] p-12">
            <div className="flex items-start gap-8 mb-12">
              <div className="p-5 bg-orange-500/10 rounded-3xl text-orange-500"><Terminal size={40} /></div>
              <div className="flex-1">
                <h2 className="text-3xl font-black mb-3 text-orange-400 uppercase">Audit Engine v2.5</h2>
                <p className="text-gray-400 font-medium leading-relaxed">Para habilitar o rastreamento de uso e transações atômicas, você deve atualizar seu banco de dados com a lógica abaixo.</p>
                <button onClick={() => refreshData()} className="mt-6 flex items-center gap-2 px-6 py-3 bg-white/5 border border-gray-700 rounded-xl font-black text-xs uppercase hover:bg-white/10 transition-all"><RefreshCw size={16} /> Re-sincronizar Agora</button>
              </div>
            </div>
            <div className="relative group">
              <button onClick={() => { navigator.clipboard.writeText(sqlCode); setCopiedSql(true); setTimeout(() => setCopiedSql(false), 2000); }} className="absolute top-4 right-4 p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all">
                {copiedSql ? <Check className="text-green-500"/> : <Copy size={20}/>}
              </button>
              <pre className="bg-[#0a0c14] border border-gray-800 p-10 rounded-[32px] overflow-x-auto text-[13px] font-mono text-blue-300/90 max-h-[500px] scrollbar-thin">
                {sqlCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black flex items-center gap-3"><ShieldAlert className="text-blue-500" /> Logs de Consumo</h2>
            <button 
              onClick={async () => { 
                if(!confirm('Limpar todo o histórico?')) return; 
                setLoading(true);
                const { error } = await supabase.from('stock_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
                if(error) alert(error.message);
                await refreshData(); 
                setLoading(false);
              }} 
              className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-black text-[10px] uppercase hover:bg-red-500/20 transition-all"
            >
              Limpar Histórico
            </button>
          </div>

          <div className="bg-[#111622] border border-gray-800 rounded-[40px] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0a0c14] border-b border-gray-800">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Serviço</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Conteúdo Entregue</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Chave Utilizada</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-gray-600 font-black uppercase tracking-widest">Nenhum registro de consumo encontrado</td>
                    </tr>
                  ) : (
                    history.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{entry.productIcon}</span>
                            <span className="font-black text-sm">{entry.productName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 font-mono text-xs text-blue-400">{entry.content}</td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-lg font-black text-[10px] border ${entry.keyUsed === 'adminkey777' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                            {entry.keyUsed}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-[10px] font-bold text-gray-500">{new Date(entry.consumedAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'KEYS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="bg-[#111622] border border-gray-800 rounded-[40px] p-10 h-fit shadow-2xl">
            <h2 className="text-2xl font-black mb-10 flex items-center gap-3"><PlusCircle className="text-blue-500" /> Forjar Keys</h2>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Duração</label>
                <div className="grid grid-cols-2 gap-2">
                  {['minutes', 'hours', 'days', 'permanent'].map((unit) => (
                    <button key={unit} onClick={() => setExpiryUnit(unit)} className={`py-3 rounded-xl font-black text-[9px] uppercase border transition-all ${expiryUnit === unit ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#0a0c14] border-gray-800 text-gray-500'}`}>{unit}</button>
                  ))}
                </div>
                {expiryUnit !== 'permanent' && <input type="number" value={keyTime} onChange={e => setKeyTime(Number(e.target.value))} className="w-full bg-[#0a0c14] border border-gray-800 rounded-2xl p-4 font-black text-xl text-blue-400 outline-none" />}
              </div>
              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Qtd</label>
                <input type="number" value={keyCount} onChange={e => setKeyCount(Number(e.target.value))} className="w-full bg-[#0a0c14] border border-gray-800 rounded-2xl p-4 font-black text-xl text-blue-400 outline-none" />
              </div>
              <button 
                onClick={async () => {
                   setLoading(true);
                   try {
                    const newKeys = [];
                    const expiryDate = expiryUnit === 'permanent' ? '9999-12-31T23:59:59Z' : new Date(Date.now() + (keyTime * (expiryUnit === 'minutes' ? 60000 : expiryUnit === 'hours' ? 3600000 : 86400000))).toISOString();
                    for(let i=0; i<keyCount; i++) newKeys.push({ code: 'NX-'+Math.random().toString(36).substring(2,10).toUpperCase(), expires_at: expiryDate });
                    const { error } = await supabase.from('keys').insert(newKeys);
                    if(error) throw error;
                    await refreshData();
                   } catch(e:any) { alert(e.message) } finally { setLoading(false); }
                }} 
                disabled={loading} 
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase shadow-xl transition-all"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'GERAR AGORA'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#111622] border border-gray-800 rounded-[40px] p-10 max-h-[800px] overflow-auto shadow-2xl scrollbar-thin">
            <h2 className="text-2xl font-black flex items-center gap-3 mb-10"><HistoryIcon className="text-blue-500" /> Chaves Ativas ({keys.length})</h2>
            <div className="grid gap-4">
              {keys.map(key => (
                <div key={key.id} className="bg-[#0a0c14] border border-gray-800 p-6 rounded-[24px] flex justify-between items-center group hover:border-blue-500/30 transition-all">
                  <div className="space-y-1">
                    <code className="text-blue-400 font-mono font-black text-xl tracking-tighter">{key.code}</code>
                    <div className="flex gap-3">
                       <p className="text-[10px] text-gray-500 uppercase font-black">Expira: {new Date(key.expiresAt).getFullYear() > 9000 ? 'ILIMITADA' : new Date(key.expiresAt).toLocaleString()}</p>
                       {key.used && <span className="text-[10px] text-red-500 font-black uppercase px-2 bg-red-500/10 rounded-md">Utilizada</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteKey(key.id)} 
                    disabled={deletingId === key.id}
                    className="p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all disabled:opacity-30"
                  >
                    {deletingId === key.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PRODUCTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-[#111622] border border-gray-800 rounded-[40px] p-10 shadow-2xl h-fit">
            <h2 className="text-2xl font-black mb-10 uppercase"><Zap className="text-blue-500" /> Registrar Serviço</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <input value={newProductIcon} onChange={e => setNewProductIcon(e.target.value)} className="w-20 bg-[#0a0c14] border border-gray-800 rounded-2xl p-4 text-3xl text-center outline-none" />
                <input value={newProductName} onChange={e => setNewProductName(e.target.value)} className="flex-1 bg-[#0a0c14] border border-gray-800 rounded-2xl p-4 font-black text-xl outline-none" placeholder="Nome do Serviço" />
              </div>
              <button 
                onClick={async () => {
                  if(!newProductName) return;
                  setLoading(true);
                  const { error } = await supabase.from('products').insert({ name: newProductName, icon: newProductIcon });
                  if(error) alert(error.message);
                  setNewProductName('');
                  await refreshData();
                  setLoading(false);
                }} 
                disabled={loading} 
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black shadow-xl"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'ADICIONAR'}
              </button>
            </div>
          </div>

          <div className="bg-[#111622] border border-gray-800 rounded-[40px] p-10 space-y-8 overflow-auto max-h-[800px] shadow-2xl scrollbar-thin">
            <h2 className="text-2xl font-black uppercase"><Package className="text-blue-500" /> Inventário</h2>
            {products.map(product => (
              <div key={product.id} className="bg-[#0a0c14] border border-gray-800 p-6 rounded-[32px] hover:border-blue-500/20 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl p-3 bg-gray-900 rounded-2xl">{product.icon}</span>
                    <div>
                      <span className="font-black text-xl block">{product.name}</span>
                      <span className="text-[10px] text-gray-500 font-black uppercase">{product.stock.length} em estoque</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedProductId(selectedProductId === product.id ? null : product.id)} className="px-5 py-2 bg-blue-500/10 text-blue-500 rounded-xl font-black text-[9px] uppercase">ESTOQUE</button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)} 
                      disabled={deletingId === product.id}
                      className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-30"
                    >
                      {deletingId === product.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20}/>}
                    </button>
                  </div>
                </div>
                {selectedProductId === product.id && (
                  <div className="mt-6 space-y-4">
                    <textarea value={stockInput} onChange={e => setStockInput(e.target.value)} className="w-full h-32 bg-[#111622] border border-gray-800 rounded-[20px] p-4 text-sm font-mono text-blue-300 outline-none" placeholder="conta:senha (uma por linha)" />
                    <button 
                      onClick={async () => {
                        const lines = stockInput.split('\n').filter(l => l.trim());
                        if(lines.length === 0) return;
                        setLoading(true);
                        const { error } = await supabase.from('stock').insert(lines.map(l => ({ product_id: product.id, content: l.trim() })));
                        if(error) alert(error.message);
                        setStockInput('');
                        setSelectedProductId(null);
                        await refreshData();
                        setLoading(false);
                      }} 
                      className="w-full bg-blue-600 py-4 rounded-[16px] font-black text-xs uppercase shadow-lg active:scale-95 transition-all"
                    >
                      Salvar no Banco
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
