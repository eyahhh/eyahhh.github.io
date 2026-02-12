
import React, { useState } from 'react';
import { Key, Product } from '../types';
import { Trash2, ArrowLeft, PlusCircle, AlertCircle, History, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  keys: Key[];
  products: Product[];
  refreshData: () => Promise<void>;
  onExit: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ keys, products, refreshData, onExit }) => {
  const [activeTab, setActiveTab] = useState<'KEYS' | 'PRODUCTS'>('KEYS');
  const [keyHours, setKeyHours] = useState(1);
  const [keyCount, setKeyCount] = useState(1);
  const [newProductName, setNewProductName] = useState('');
  const [newProductIcon, setNewProductIcon] = useState('✨');
  const [stockInput, setStockInput] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateKeys = async () => {
    if (keyCount <= 0 || keyHours <= 0) return;
    setLoading(true);
    try {
      const newKeys = [];
      for (let i = 0; i < keyCount; i++) {
        // Updated prefix: NEXUS-
        const code = 'NEXUS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        newKeys.push({
          code,
          expires_at: new Date(Date.now() + (keyHours * 60 * 60 * 1000)).toISOString()
        });
      }
      const { error } = await supabase.from('keys').insert(newKeys);
      if (error) throw error;
      await refreshData();
      alert(`${keyCount} keys geradas com sucesso!`);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao gerar keys.');
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Excluir esta key permanentemente?')) return;
    try {
      const { error } = await supabase.from('keys').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (err: any) {
      alert('Erro ao deletar key.');
    }
  };

  const addProduct = async () => {
    if (!newProductName.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('products').insert({
        name: newProductName,
        icon: newProductIcon
      });
      if (error) throw error;
      setNewProductName('');
      await refreshData();
    } catch (err: any) {
      alert('Erro ao criar produto.');
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id: string) => {
    if (confirm('Remover produto e todo seu estoque vinculado?')) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        await refreshData();
      } catch (err: any) {
        alert('Erro ao remover produto.');
      }
    }
  };

  const addStock = async (productId: string) => {
    const lines = stockInput.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    setLoading(true);
    try {
      const newStock = lines.map(line => ({
        product_id: productId,
        content: line.trim()
      }));

      const { error } = await supabase.from('stock').insert(newStock);
      if (error) throw error;
      setStockInput('');
      setSelectedProductId(null);
      await refreshData();
      alert('Estoque atualizado!');
    } catch (err: any) {
      alert('Erro ao adicionar estoque.');
    } finally {
      setLoading(false);
    }
  };

  const clearStock = async (productId: string) => {
    if (confirm('Limpar TODO o estoque deste produto?')) {
      try {
        const { error } = await supabase.from('stock').delete().eq('product_id', productId);
        if (error) throw error;
        await refreshData();
      } catch (err: any) {
        alert('Erro ao limpar estoque.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center space-x-4">
          <button onClick={onExit} className="p-2 hover:bg-gray-800 rounded-lg transition-colors group">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight">PAINEL NEXUS</h1>
        </div>
        <nav className="flex bg-[#111622] p-1 rounded-xl border border-gray-800">
          <button 
            onClick={() => setActiveTab('KEYS')} 
            className={`px-6 py-2 rounded-lg transition-all ${activeTab === 'KEYS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Keys
          </button>
          <button 
            onClick={() => setActiveTab('PRODUCTS')} 
            className={`px-6 py-2 rounded-lg transition-all ${activeTab === 'PRODUCTS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Estoque
          </button>
        </nav>
      </div>

      {activeTab === 'KEYS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-[#111622] border border-gray-800 rounded-2xl p-6 h-fit shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><PlusCircle className="text-blue-500" /> Gerar Keys</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block uppercase font-bold">Duração (Horas)</label>
                <input 
                  type="number" 
                  value={keyHours} 
                  onChange={e => setKeyHours(Number(e.target.value))} 
                  className="w-full bg-[#0a0c14] border border-gray-800 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" 
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block uppercase font-bold">Quantidade</label>
                <input 
                  type="number" 
                  value={keyCount} 
                  onChange={e => setKeyCount(Number(e.target.value))} 
                  className="w-full bg-[#0a0c14] border border-gray-800 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" 
                />
              </div>
              <button 
                onClick={generateKeys} 
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Gerar'}
              </button>
            </div>
          </div>
          <div className="lg:col-span-2 bg-[#111622] border border-gray-800 rounded-2xl p-6 max-h-[600px] overflow-auto shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><History className="text-purple-500" /> Histórico ({keys.length})</h2>
            <div className="space-y-3">
              {keys.map(key => (
                <div key={key.id} className="bg-[#0a0c14] border border-gray-800 p-4 rounded-xl flex justify-between items-center group">
                  <div>
                    <code className="text-blue-400 font-mono font-bold">{key.code}</code>
                    <p className="text-xs text-gray-500 mt-1">Expira: {new Date(key.expiresAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => deleteKey(key.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#111622] border border-gray-800 rounded-2xl p-6 shadow-xl h-fit">
            <h2 className="text-xl font-bold mb-6">Novo Produto</h2>
            <div className="flex gap-4 mb-4">
              <div className="w-20 text-center">
                <label className="text-xs text-gray-500 mb-1 block">Ícone</label>
                <input value={newProductIcon} onChange={e => setNewProductIcon(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center text-xl outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Nome</label>
                <input value={newProductName} onChange={e => setNewProductName(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-lg p-3 outline-none" placeholder="Netflix" />
              </div>
            </div>
            <button onClick={addProduct} disabled={loading} className="w-full py-4 bg-blue-600 rounded-xl font-bold">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Criar'}</button>
          </div>
          <div className="bg-[#111622] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl overflow-auto max-h-[600px]">
            {products.map(product => (
              <div key={product.id} className="bg-[#0a0c14] border border-gray-800 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{product.icon}</span>
                    <div>
                      <span className="font-bold block">{product.name}</span>
                      <span className="text-xs text-blue-400">{product.stock.length} contas</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedProductId(selectedProductId === product.id ? null : product.id)} className="text-xs font-bold px-3 py-1 rounded-lg bg-blue-600/10 text-blue-400">Gerenciar</button>
                    <button onClick={() => removeProduct(product.id)} className="p-2 text-red-500"><Trash2 size={16}/></button>
                  </div>
                </div>
                {selectedProductId === product.id && (
                  <div className="mt-4 space-y-3">
                    <textarea value={stockInput} onChange={e => setStockInput(e.target.value)} className="w-full h-32 bg-[#111622] border border-gray-800 rounded-xl p-3 text-xs font-mono outline-none" placeholder="user:pass" />
                    <button onClick={() => addStock(product.id)} className="w-full bg-blue-600 py-2 rounded-lg text-xs font-bold">Adicionar</button>
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
