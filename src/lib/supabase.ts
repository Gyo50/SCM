// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// process.env를 통해 .env.local에 저장한 키를 안전하게 불러옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);