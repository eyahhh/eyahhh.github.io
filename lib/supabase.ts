
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kkmkqfebtoptotuohesa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbWtxZmVidG9wdG90dW9oZXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDk1NjksImV4cCI6MjA4NjQ4NTU2OX0.GVCzLb4w4-KJJtZ6Hvu45H-ldYCf4GRKyW_lk9aQ4lQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * --- SCRIPT SQL DE PRODUÇÃO (DELETE FIX) ---
 * 
 * -- 1. Ativar RLS
 * ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.keys ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
 * 
 * -- 2. Criar políticas globais permitindo TUDO (CRUD) para facilitar a gestão
 * -- O "WITH CHECK (true)" é o segredo para permitir deleções e updates no navegador.
 * 
 * DROP POLICY IF EXISTS "Acesso_Total_Produtos" ON public.products;
 * CREATE POLICY "Acesso_Total_Produtos" ON public.products FOR ALL USING (true) WITH CHECK (true);
 * 
 * DROP POLICY IF EXISTS "Acesso_Total_Estoque" ON public.stock;
 * CREATE POLICY "Acesso_Total_Estoque" ON public.stock FOR ALL USING (true) WITH CHECK (true);
 * 
 * DROP POLICY IF EXISTS "Acesso_Total_Keys" ON public.keys;
 * CREATE POLICY "Acesso_Total_Keys" ON public.keys FOR ALL USING (true) WITH CHECK (true);
 * 
 * DROP POLICY IF EXISTS "Acesso_Total_Historico" ON public.stock_history;
 * CREATE POLICY "Acesso_Total_Historico" ON public.stock_history FOR ALL USING (true) WITH CHECK (true);
 * 
 * -- 3. Conceder permissões técnicas aos roles do Supabase
 * GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
 * GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
 */
