const ALLOWED_ORIGINS = [
  'https://promojour.lovable.app',
  'https://www.promojour.fr',
  'https://promojour.fr',
  'http://localhost:5173',
  'http://localhost:3000',
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  // Allow exact matches + any *.lovableproject.com or *.lovable.app preview domains
  const isAllowed = ALLOWED_ORIGINS.includes(origin) 
    || origin.endsWith('.lovableproject.com') 
    || origin.endsWith('.lovable.app');
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Vary': 'Origin',
  };
}
