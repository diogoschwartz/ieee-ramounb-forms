
import { createClient } from '@supabase/supabase-js';

/**
 * Accesses Supabase configuration. 
 * Using the provided project credentials to ensure the client initializes correctly.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
