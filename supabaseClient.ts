
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phznyksqgtanfqcphvod.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoem55a3NxZ3RhbmZxY3Bodm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjExNjIsImV4cCI6MjA3ODk5NzE2Mn0.yz1Chd7krFKH0_vNFYeg_fvTKPhEPPVGXXYboEIoQ2s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
