import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmguyrspjgsrehjqduxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ3V5cnNwamdzcmVoanFkdXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4Nzc2OTYsImV4cCI6MjA4NTQ1MzY5Nn0.ZOdGMSM-endAoxsnJsb-ZbT8fsDRYU4cpyI-dER1P5c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
