// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = 'https://pdlsbcxkbszahcmaluds.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbHNiY3hrYnN6YWhjbWFsdWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NjM5NTcsImV4cCI6MjA1NTEzOTk1N30.m12oP25YLYcYtR4lZTiYDnKmRgjyp2Qx2wMX8EvoLwU';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);