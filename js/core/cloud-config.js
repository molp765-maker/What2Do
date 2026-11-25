// Supabase settings. The real values live in cloud-config.local.js, which is git-ignored.
// To set up: copy cloud-config.example.js to cloud-config.local.js and fill in your project URL and publishable key.
// Without that file the app still runs, and the sign-in page says accounts aren't connected.
export const CLOUD_CONFIG = {url: '', anonKey: ''};
try { Object.assign(CLOUD_CONFIG, (await import('./cloud-config.local.js')).CLOUD_CONFIG); } catch { /* no local config */ }
