import { useAuth } from '@/components/auth/AuthContext';

/**
 * Thin wrapper around useAuth() that exposes just userId and isLoading.
 * Used by data hooks that only need the user ID to guard queries.
 */
export const useAuthUserId = () => {
    const { user, loading } = useAuth();
    return {
        userId: user?.id ?? null,
        isLoading: loading,
    };
};
