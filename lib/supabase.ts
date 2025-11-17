import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// TODO: Add your Supabase credentials here
// Copy from your web app's .env.local file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Mobile doesn't need URL session detection
  },
});

