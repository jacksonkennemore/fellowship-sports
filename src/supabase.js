import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pqsvtrbmvsxgmacigizd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxc3Z0cmJtdnN4Z21hY2lnaXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MzI2NzYsImV4cCI6MjA5NjAwODY3Nn0.Ka7p3z7npLcyhAk6HW7U6plUhT0rl1AbKq8YTdggzP8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
