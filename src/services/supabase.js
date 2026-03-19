import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qycsekkegulnqmiepjnc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5Y3Nla2tlZ3VsbnFtaWVwam5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzc3OTAsImV4cCI6MjA4OTUxMzc5MH0.H4fCG59Xlqc_Tim_WjKGs1yvKiNMaB6uMKfK9T9OpiA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
