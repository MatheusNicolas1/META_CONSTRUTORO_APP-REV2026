import posthog from 'posthog-js'
import { v4 as uuidv4 } from 'uuid'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'
const IS_DEV = import.meta.env.DEV

// Session Store (Memory only, relies on App to set it)
let sessionData = {
    org_id: undefined as string | undefined,
    user_id: undefined as string | undefined,
    role: undefined as string | undefined
}

export const initAnalytics = () => {
    if (POSTHOG_KEY) {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            debug: IS_DEV,
            loaded: (ph) => {
                if (IS_DEV) console.log('PostHog loaded', ph)
            }
        })
    } else if (IS_DEV) {
        console.log('[Analytics] PostHog key not found. Events will be logged to console.')
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
}

export const identifyUser = (userId: string, traits: Record<string, any> = {}) => {
    // Wrapper legacy support
    setAnalyticsSession({ user_id: userId, ...traits })
}

export const resetUser = () => {
    sessionData = { org_id: undefined, user_id: undefined, role: undefined }
    if (POSTHOG_KEY) {
        posthog.reset()
    }
}

export const track = (eventName: string, properties: Record<string, any> = {}) => {
    const finalProps = {
        ...properties,
        // Standard Props (9.3)
        org_id: sessionData.org_id,
        user_id: sessionData.user_id,
        role: sessionData.role,
        environment: IS_DEV ? 'development' : 'production',
        app_version: import.meta.env.VITE_APP_VERSION || 'unknown',
        route: window.location.pathname,
        source: 'frontend',
        timestamp: new Date().toISOString(),
        request_id: uuidv4(), // Unique ID per event
    }

    if (POSTHOG_KEY) {
        posthog.capture(eventName, finalProps)
    }

    if (IS_DEV) {
        console.log(`[Analytics] Track: ${eventName}`, finalProps)
    }
}

export default {
    init: initAnalytics,
    setSession: setAnalyticsSession,
    identify: identifyUser,
    reset: resetUser,
    track
}
