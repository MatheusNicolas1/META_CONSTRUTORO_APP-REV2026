const productionOrigins = [
  'https://www.metaconstrutor.app.br',
  'https://metaconstrutor.app.br',
  'https://www.metaconstrutor.com.br',
  'https://metaconstrutor.com.br'
];
const isLocalOrigin = (origin)=>{
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};
const configuredOrigins = ()=>{
  const envOrigins = [
    Deno.env.get('ALLOWED_ORIGIN'),
    Deno.env.get('ALLOWED_ORIGINS')
  ].filter(Boolean).flatMap((value)=>value.split(',')).map((origin)=>origin.trim()).filter(Boolean);
  return [
    ...new Set([
      ...productionOrigins,
      ...envOrigins
    ])
  ];
};
export const getCorsHeaders = (req)=>{
  const requestOrigin = req?.headers.get('origin') || '';
  const allowedOrigins = configuredOrigins();
  const origin = allowedOrigins.includes(requestOrigin) || isLocalOrigin(requestOrigin) ? requestOrigin : productionOrigins[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };
};
export const corsHeaders = getCorsHeaders();
