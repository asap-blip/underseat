import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

// Read client (anon key). Safe for both server and browser reads under RLS.
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return browserClient;
}

// Write client (service role). Server-only; never import into client bundles.
export function getServiceSupabase(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  if (!serverClient) {
    serverClient = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return serverClient;
}
