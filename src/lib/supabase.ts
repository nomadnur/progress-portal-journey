import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create mock client for when Supabase is not connected
const createMockClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ error: { message: 'Please connect to Supabase first' } }),
    signUp: () => Promise.resolve({ error: { message: 'Please connect to Supabase first' } }),
    signOut: () => Promise.resolve({ error: null }),
  },
  from: () => ({
    select: () => ({ 
      eq: () => ({ 
        single: () => Promise.resolve({ data: null, error: { message: 'Please connect to Supabase first' } }),
        order: () => Promise.resolve({ data: [], error: { message: 'Please connect to Supabase first' } })
      }),
      order: () => Promise.resolve({ data: [], error: { message: 'Please connect to Supabase first' } })
    }),
    insert: () => Promise.resolve({ error: { message: 'Please connect to Supabase first' } }),
    update: () => Promise.resolve({ error: { message: 'Please connect to Supabase first' } }),
  }),
} as any);

let supabaseClient;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not found. Please connect to Supabase via the integration.');
  supabaseClient = createMockClient();
} else {
  supabaseClient = createClient(supabaseUrl, supabaseKey);
}

export const supabase = supabaseClient;