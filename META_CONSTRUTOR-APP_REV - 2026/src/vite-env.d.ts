// /// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_SENTRY_DSN: string
    readonly VITE_SENTRY_ENVIRONMENT?: string
    readonly VITE_APP_VERSION: string
    readonly VITE_N8N_WEBHOOK_URL: string
    readonly VITE_POSTHOG_KEY: string
    readonly VITE_POSTHOG_HOST: string
    readonly VITE_STRIPE_PUBLISHABLE_KEY: string
    readonly VITE_ENABLE_ACTIVITY_REALTIME?: string
    readonly MODE: string
    readonly BASE_URL: string
    readonly PROD: boolean
    readonly DEV: boolean
    readonly SSR: boolean
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.css' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.jpeg' {
    const content: string;
    export default content;
}

declare module '*.gif' {
    const content: string;
    export default content;
}

declare module '*.webp' {
    const content: string;
    export default content;
}
