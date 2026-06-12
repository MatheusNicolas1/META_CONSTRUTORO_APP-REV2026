import posthog from 'posthog-js'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/integrations/supabase/client'
import { sanitizeAnalyticsProperties } from '@/utils/analyticsPrivacy'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'
const IS_DEV = import.meta.env.DEV

declare global {
  interface Window {
    posthog?: {
      __loaded?: boolean;
    };
  }
}

type MarketingAttribution = {
    anonymous_id?: string
    session_id?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
    utm_term?: string
    ref?: string
    referrer?: string
}

const ANONYMOUS_ID_KEY = 'mc_anonymous_id'
const SESSION_ID_KEY = 'mc_session_id'
const ATTRIBUTION_KEY = 'mc_marketing_attribution'

const getStoredJson = (key: string): MarketingAttribution => {
    try {
        return JSON.parse(localStorage.getItem(key) || '{}')
    } catch {
        return {}
    }
}

const ensureMarketingContext = (): MarketingAttribution => {
    const anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY) || uuidv4()
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY) || uuidv4()

    localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId)
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)

    const params = new URLSearchParams(window.location.search)
    const stored = getStoredJson(ATTRIBUTION_KEY)
    const next: MarketingAttribution = {
        ...stored,
        anonymous_id: anonymousId,
        session_id: sessionId,
        referrer: stored.referrer || document.referrer || undefined,
    }

    const keys: Array<keyof MarketingAttribution> = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'ref',
    ]

    keys.forEach((key) => {
        const value = params.get(key)
        if (value) {
            next[key] = value
        }
    })

    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next))
    return next
}

// Session Store (Memory only, relies on App to set auth/org data)
let sessionData = {
    org_id: undefined as string | undefined,
    user_id: undefined as string | undefined,
    role: undefined as string | undefined
}
let lastAssociatedUserId: string | undefined

export const isPublicAnalyticsEvent = (eventName: string) => (
    eventName === 'app.public_page_viewed' ||
    eventName.startsWith('marketing.') ||
    eventName.startsWith('auth.') ||
    eventName.startsWith('billing.')
)

export const initAnalytics = () => {
    ensureMarketingContext()

    // PostHog já é inicializado no index.html via snippet inline
    // O posthog-js (import) já detecta a instância existente
    if (POSTHOG_KEY) {
        // Se não foi inicializado pelo snippet (ex: bloqueado), inicializa aqui
        if (!window.posthog?.__loaded) {
            posthog.init(POSTHOG_KEY, {
                api_host: POSTHOG_HOST,
                debug: IS_DEV,
                loaded: () => {
                    if (IS_DEV) console.debug('[Analytics] PostHog initialized (fallback)')
                }
            })
        }
    } else if (IS_DEV) {
        console.debug('[Analytics] PostHog key not configured')
    }
}

export const setAnalyticsSession = (data: { org_id?: string, user_id?: string, role?: string }) => {
    sessionData = { ...sessionData, ...data }
    if (data.user_id && POSTHOG_KEY) {
        posthog.identify(data.user_id, {
            email: undefined, // Avoid PII
            role: data.role,
            org_id: data.org_id
        })
    }

    if (data.user_id && lastAssociatedUserId !== data.user_id) {
        lastAssociatedUserId = data.user_id
        track('auth.user_identified', {
            association_source: 'auth_session',
        })
    }
}

export const identifyUser = (userId: string, traits: Record<string, any> = {}) => {
    // Wrapper legacy support
    setAnalyticsSession({ user_id: userId, ...traits })
}

export const resetUser = () => {
    sessionData = { org_id: undefined, user_id: undefined, role: undefined }
    lastAssociatedUserId = undefined
    if (POSTHOG_KEY) {
        posthog.reset()
    }
}

export const track = (eventName: string, properties: Record<string, any> = {}) => {
    const requestId = uuidv4()
    const marketingContext = ensureMarketingContext()
    const finalProps = sanitizeAnalyticsProperties({
        ...properties,
        ...marketingContext,
        // Standard Props (9.3)
        org_id: sessionData.org_id,
        user_id: sessionData.user_id,
        role: sessionData.role,
        environment: IS_DEV ? 'development' : 'production',
        app_version: import.meta.env.VITE_APP_VERSION || 'unknown',
        route: window.location.pathname,
        source: 'frontend',
        timestamp: new Date().toISOString(),
        request_id: requestId, // Unique ID per event
    })

    if (POSTHOG_KEY) {
        posthog.capture(eventName, finalProps)
    }

    if (IS_DEV) {
        console.debug('[Analytics] Event tracked:', eventName, finalProps)
    }

    const isPublicMarketingEvent =
        eventName === 'app.public_page_viewed' ||
        eventName.startsWith('marketing.')

    const hasAuthenticatedAnalyticsContext = Boolean(sessionData.user_id && sessionData.org_id)
    const shouldPersistPublicEvent = isPublicAnalyticsEvent(eventName) && !sessionData.user_id && !sessionData.org_id

    const basePayload = {
        event: eventName,
        properties: finalProps,
        source: 'frontend',
        environment: IS_DEV ? 'development' : 'production',
        request_id: requestId,
        success: true,
        anonymous_id: marketingContext.anonymous_id,
        session_id: marketingContext.session_id,
        utm_source: marketingContext.utm_source,
        utm_medium: marketingContext.utm_medium,
        utm_campaign: marketingContext.utm_campaign,
        utm_content: marketingContext.utm_content,
        utm_term: marketingContext.utm_term,
        ref: marketingContext.ref,
        referrer: marketingContext.referrer,
    }

    if (hasAuthenticatedAnalyticsContext && !isPublicMarketingEvent) {
        supabase
            .from('analytics_events')
            .insert({
                ...basePayload,
                org_id: sessionData.org_id,
                user_id: sessionData.user_id,
                role: sessionData.role,
            })
            .then(({ error }) => {
                if (error && IS_DEV) {
                    console.warn('[Analytics] DB fallback failed:', error.message)
                }
            })
    } else if (shouldPersistPublicEvent) {
        supabase
            .from('analytics_events')
            .insert(basePayload)
            .then(({ error }) => {
                if (error && IS_DEV) {
                    console.warn('[Analytics] Public DB fallback failed:', error.message)
                }
            })
    }
}

export default {
    init: initAnalytics,
    setSession: setAnalyticsSession,
    identify: identifyUser,
    reset: resetUser,
    track
}
