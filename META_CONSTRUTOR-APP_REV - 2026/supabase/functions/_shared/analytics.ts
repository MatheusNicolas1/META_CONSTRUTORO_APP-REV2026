import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const POSTHOG_API_KEY = Deno.env.get("POSTHOG_API_KEY");
const POSTHOG_HOST = Deno.env.get("POSTHOG_HOST") || "https://app.posthog.com";

interface AnalyticsContext {
    org_id?: string | null;
    user_id?: string | null;
    role?: string | null;
    request_id: string; // Required for traceability
}

interface AnalyticsEvent {
    event: string;
    properties?: Record<string, any>;
    success?: boolean;
    error?: string;
}

export async function trackServerEvent(
    supabaseClient: SupabaseClient,
    context: AnalyticsContext,
    payload: AnalyticsEvent
) {
    const { event, properties, success = true, error } = payload;

    const finalProps = {
        ...properties,
        // Standard Props (9.3)
        org_id: context.org_id || null,
        user_id: context.user_id || null,
        role: context.role || 'system',
        request_id: context.request_id,
        environment: Deno.env.get("SUPABASE_URL")?.includes('localhost') ? 'development' : 'production',
        app_version: Deno.env.get("APP_VERSION") || 'unknown',
        source: 'backend',
        timestamp: new Date().toISOString(),
        success: success,
        error: error || null
    };

    // 1. Log to Console (Always)
    const logPrefix = success ? '[Analytics][OK]' : '[Analytics][ERR]';
    console.log(`${logPrefix} ${event}`, JSON.stringify(finalProps));

    // 2. Send to PostHog (if Key exists)
    if (POSTHOG_API_KEY) {
        try {
            await fetch(`${POSTHOG_HOST}/capture/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    api_key: POSTHOG_API_KEY,
                    event: event,
                    properties: {
                        distinct_id: context.user_id || 'system',
                        ...finalProps
                    }
                })
            });
        } catch (err) {
            console.error("[Analytics] PostHog failed:", err);
        }
    }

    // 3. Fallback DB (Fail-safe)
    // Always attempt to save to DB in this milestone as verification is critical
    try {
        const { error: dbError } = await supabaseClient
            .from('analytics_events')
            .insert({
                event: event,
                org_id: context.org_id,
                user_id: context.user_id,
                source: 'backend',
                properties: finalProps,
                environment: finalProps.environment,
                request_id: context.request_id,
                success: success,
                error: error
            });

        if (dbError) {
            // Suppress 'relation does not exist' in local if migration missing, else log
            if (dbError.code !== '42P01') {
                console.error("[Analytics] DB Fallback failed:", dbError.message);
            }
        }
    } catch (dbException) {
        // Must not crash the caller
        console.error("[Analytics] DB Fallback exception:", dbException);
    }
}
