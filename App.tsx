
import React, { useState, useEffect, useCallback } from 'react';
import { Key, Product, ViewState, ADMIN_KEY, StockHistoryEntry } from './types';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';
import { supabase } from './lib/supabase';
import { AlertTriangle, Database } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [activeKey, setActiveKey] = useState<Key | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [keys, setKeys] = useState<Key[]>([]);
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    
    setDbError(null);
    try {
      // 1. Fetch Products
      const { data: productsData, error: pError } = await supabase.from('products').select('*');
      if (pError) {
        if (pError.code === 'PGRST205') {
          setDbError("Tabelas desconfiguradas.");
          return; 
        }
        throw pError;
      }

      // 2. Fetch Stock
      const { data: stockData, error: sError } = await supabase.from('stock').select('product_id');
      if (sError) throw sError;
      
      const formattedProducts = (productsData || []).map(p => ({
        ...p,
        stock: (stockData || []).filter(s => s.product_id === p.id)
      }));

      setProducts(formattedProducts);

      // 3. Fetch Keys
      const { data: keysData, error: kError } = await supabase.from('keys').select('*').order('created_at', { ascending: false });
      if (kError) throw kError;

      setKeys((keysData || []).map(k => ({
        ...k,
        expiresAt: new Date(k.expires_at).getTime(),
        createdAt: new Date(k.created_at || Date.now()).getTime()
      })));

      // 4. Fetch Audit History (Admin only usage)
      const { data: historyData, error: hError } = await supabase
        .from('stock_history')
        .select(`
          *,
          products (
            name,
            icon
          )
        `)
        .order('consumed_at', { ascending: false });
      
      if (!hError && historyData) {
        setHistory(historyData.map(h => ({
          id: h.id,
          productId: h.product_id,
          productName: h.products?.name || 'Produto Removido',
          productIcon: h.products?.icon || '❌',
          content: h.content,
          keyUsed: h.key_used,
          consumedAt: new Date(h.consumed_at).getTime()
        })));
      }

    } catch (error: any) {
      console.error("Erro Nexus Data:", error);
      setDbError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const handleLogin = async (code: string) => {
    if (code === ADMIN_KEY) {
      setView('ADMIN');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('keys')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (data.used) {
          alert('Esta key já foi utilizada e não pode ser reutilizada!');
          return;
        }
        const expiresAt = new Date(data.expires_at).getTime();
        if (Date.now() > expiresAt) {
          alert('Esta key expirou!');
          return;
        }
        setActiveKey({
          ...data,
          expiresAt,
          createdAt: new Date(data.created_at).getTime()
        });
        setView('DASHBOARD');
      } else {
        alert('Key inválida!');
      }
    } catch (err) {
      alert('Erro na autenticação.');
    }
  };

  const handleLogout = () => {
    setActiveKey(null);
    setView('LOGIN');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0c14] flex flex-col items-center justify-center gap-6">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white">
      {view === 'LOGIN' && <Login onLogin={handleLogin} />}
      {view === 'DASHBOARD' && activeKey && (
        <UserDashboard activeKey={activeKey} products={products} onLogout={handleLogout} refreshData={fetchData} />
      )}
      {view === 'ADMIN' && (
        <AdminPanel 
          keys={keys} 
          products={products} 
          history={history}
          refreshData={fetchData}
          onExit={() => setView('LOGIN')}
          dbStatus={dbError ? 'ERROR' : 'OK'}
        />
      )}
      {refreshing && (
        <div className="fixed bottom-6 right-6 bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
          <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando</span>
        </div>
      )}
    </div>
  );
};

export default App;
