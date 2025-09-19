import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bssjgbvspxklnotczupl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzc2pnYnZzcHhrbG5vdGN6dXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTE3ODYsImV4cCI6MjA3MzgyNzc4Nn0.wEE-yziYIQMEJduRoPjnPSr2HDFfxAGi1JyHGeB6IgY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});