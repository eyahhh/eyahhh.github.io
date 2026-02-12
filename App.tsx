
import React, { useState, useEffect } from 'react';
import { Key, Product, ViewState, ADMIN_KEY } from './types';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [activeKey, setActiveKey] = useState<Key | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados iniciais do Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Products with Stock count
      const { data: productsData } = await supabase.from('products').select('*');
      const { data: stockData } = await supabase.from('stock').select('product_id');
      
      const formattedProducts = (productsData || []).map(p => ({
        ...p,
        stock: (stockData || []).filter(s => s.product_id === p.id)
      }));

      setProducts(formattedProducts);

      // Fetch Keys
      const { data: keysData } = await supabase.from('keys').select('*');
      setKeys((keysData || []).map(k => ({
        ...k,
        expiresAt: new Date(k.expires_at).getTime(),
        createdAt: new Date(k.created_at).getTime()
      })));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Monitorar expiração da key ativa
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeKey && activeKey.code !== ADMIN_KEY) {
        if (Date.now() > activeKey.expiresAt) {
          setActiveKey(null);
          setView('LOGIN');
          alert('Sua key expirou!');
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeKey]);

  const handleLogin = async (code: string) => {
    if (code === ADMIN_KEY) {
      setView('ADMIN');
      return;
    }

    // Verificar no Supabase
    const { data, error } = await supabase
      .from('keys')
      .select('*')
      .eq('code', code)
      .single();

    if (data) {
      const expiresAt = new Date(data.expires_at).getTime();
      if (Date.now() > expiresAt) {
        alert('Esta key já expirou!');
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
  };

  const handleLogout = () => {
    setActiveKey(null);
    setView('LOGIN');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white">
      {view === 'LOGIN' && <Login onLogin={handleLogin} />}
      {view === 'DASHBOARD' && activeKey && (
        <UserDashboard 
          activeKey={activeKey} 
          products={products} 
          onLogout={handleLogout}
          refreshData={fetchData}
        />
      )}
      {view === 'ADMIN' && (
        <AdminPanel 
          keys={keys} 
          products={products} 
          refreshData={fetchData}
          onExit={() => setView('LOGIN')}
        />
      )}
    </div>
  );
};

export default App;
