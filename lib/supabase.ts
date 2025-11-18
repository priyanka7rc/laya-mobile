import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// TODO: Add your Supabase credentials here
// Copy from your web app's .env.local file
const supabaseUrl = 'https://xippswmvbwrtufwgsais.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcHBzd212YndydHVmd2dzYWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MDQ4MDUsImV4cCI6MjA3NzM4MDgwNX0.lzr3t59MwlBPWYD4BdXMLnB5cREWm24i5q99kl5SEkQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Mobile doesn't need URL session detection
  },
});


// Supabase (your existing vars)
//NEXT_PUBLIC_SUPABASE_URL=https://xippswmvbwrtufwgsais.supabase.co
//NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcHBzd212YndydHVmd2dzYWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MDQ4MDUsImV4cCI6MjA3NzM4MDgwNX0.lzr3t59MwlBPWYD4BdXMLnB5cREWm24i5q99kl5SEkQ
