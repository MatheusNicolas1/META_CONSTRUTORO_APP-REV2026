const productionOrigin = 'https://metaconstrutor.com.br';

const isLocalOrigin = (origin: string) => {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

export const getCorsHeaders = (req?: Request) => {
    const requestOrigin = req?.headers.get('origin') || '';
    const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || productionOrigin;
    const origin = requestOrigin === allowedOrigin || isLocalOrigin(requestOrigin)
        ? requestOrigin
        : allowedOrigin;

    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    };
};

export const corsHeaders = getCorsHeaders();
