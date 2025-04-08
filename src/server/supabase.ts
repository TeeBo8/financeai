import { createClient } from '@supabase/supabase-js';
import { env } from '~/env';

// Création d'un client Supabase singleton pour réutilisation
const supabaseUrl = 'https://ymtizdwqnspjluiwyqpt.supabase.co';
const supabaseKey = env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey); 