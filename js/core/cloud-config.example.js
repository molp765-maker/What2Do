// Copy this file to cloud-config.local.js (git-ignored) and fill in your Supabase project values.
// Use the publishable/anon key only. Never put a sb_secret_ / service_role key in browser code.
export const CLOUD_CONFIG = {
  url: 'https://YOUR-PROJECT.supabase.co',
  anonKey: 'sb_publishable_...'
};
