import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ypoikgkkikfxtgnsnocd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb2lrZ2traWtmeHRnbnNub2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMjQ5NDQsImV4cCI6MjA3MTYwMDk0NH0.VNA5dnZ006imCkFMXPZBCHMaQ4fRr7Vdr1kaYJdR9Lc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
