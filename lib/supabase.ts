
import { createClient } from '@supabase/supabase-js';

// Configurações do seu projeto Supabase (Substituídas conforme fornecido)
const supabaseUrl = 'https://kkmkqfebtoptotuohesa.supabase.co';
const supabaseAnonKey = 'sb_publishable_yg9-CqH9nrOdOvL_Cxu28w_p0MMlESF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
