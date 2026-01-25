import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dsabsbpvocmpomhwznbc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzYWJzYnB2b2NtcG9taHd6bmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjQxMDIsImV4cCI6MjA3Nzk0MDEwMn0.EMZH5NU_nUykl0yopQWV0d0v1rei-_AG126-tJH4n5U";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);