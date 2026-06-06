
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/integrations/analytics';
import {
    canonicalizeAuthenticatedRoute,
    getInteractionTargetId,
} from '@/utils/authenticatedAnalytics';

export const useUserInteraction = () => {
    const location = useLocation();

    // Track Page Views automatically
    useEffect(() => {
        const trackPageView = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { routeName, canonicalPath } = canonicalizeAuthenticatedRoute(location.pathname);

            await supabase.from('user_interactions' as any).insert({
                user_id: user.id,
                interaction_type: 'page_view',
                target_id: canonicalPath,
                metadata: {
                    title: document.title,
                    route_name: routeName,
                    path: location.pathname
                }
            });

            track('app.route_viewed', {
                path: location.pathname,
                canonical_path: canonicalPath,
                route_name: routeName,
                title: document.title,
            });
        };

        trackPageView();
    }, [location.pathname]);

    useEffect(() => {
        const handleAuthenticatedClick = async (event: MouseEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const interactive = target.closest('[data-analytics-id], button, a, [role="button"], [role="menuitem"]');
            if (!interactive) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { routeName, canonicalPath } = canonicalizeAuthenticatedRoute(location.pathname);
            const targetId = getInteractionTargetId(interactive, canonicalPath);
            const elementType = interactive.tagName.toLowerCase();

            try {
                await supabase.from('user_interactions' as any).insert({
                    user_id: user.id,
                    interaction_type: 'click',
                    target_id: targetId,
                    metadata: {
                        route_name: routeName,
                        canonical_path: canonicalPath,
                        path: location.pathname,
                        element_type: elementType,
                    }
                });

                track('app.authenticated_click', {
                    interaction_type: 'click',
                    target_id: targetId,
                    route_name: routeName,
                    canonical_path: canonicalPath,
                    element_type: elementType,
                });
            } catch (error) {
                console.error('Error tracking authenticated click:', error);
            }
        };

        document.addEventListener('click', handleAuthenticatedClick, true);
        return () => document.removeEventListener('click', handleAuthenticatedClick, true);
    }, [location.pathname]);

    // Helper to track manual interactions (clicks)
    const trackAction = async (action: string, targetId: string, metadata?: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { routeName, canonicalPath } = canonicalizeAuthenticatedRoute(location.pathname);

        try {
            await supabase.from('user_interactions' as any).insert({
                user_id: user.id,
                interaction_type: action,
                target_id: targetId,
                metadata: {
                    ...metadata,
                    route_name: routeName,
                    canonical_path: canonicalPath,
                    path: location.pathname,
                }
            });

            track('app.interaction_recorded', {
                interaction_type: action,
                target_id: targetId,
                route_name: routeName,
                canonical_path: canonicalPath,
                metadata,
            });
        } catch (error) {
            console.error('Error tracking action:', error);
        }
    };

    return { trackAction };
};
