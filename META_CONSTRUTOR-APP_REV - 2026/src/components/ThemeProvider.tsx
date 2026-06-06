import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: Theme;
    enableSystem?: boolean;
    attribute?: string;
    // adding storageKey to allow future migration
    storageKey?: string;
}

interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    systemTheme?: 'dark' | 'light';
}

const initialState: ThemeProviderState = {
    theme: 'light',
    setTheme: () => null,
    systemTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = 'light',
    enableSystem = false,
    attribute = 'class',
    storageKey = 'vite-ui-theme',
    ...props
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem(storageKey) as Theme | null;
            const legacyTheme = localStorage.getItem('theme') as Theme | null;
            const savedTheme = storedTheme === 'dark' || storedTheme === 'light'
                ? storedTheme
                : legacyTheme === 'dark' || legacyTheme === 'light'
                    ? legacyTheme
                    : null;

            return savedTheme || defaultTheme;
        }
        return defaultTheme;
    });

    const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('light');

    // Handle system theme detection
    useEffect(() => {
        if (!enableSystem) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

        const handleChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [enableSystem]);

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;
        const activeTheme = theme === 'system' ? systemTheme : theme;

        root.classList.remove('light', 'dark');

        if (attribute === 'class') {
            root.classList.add(activeTheme);
        } else {
            root.setAttribute(attribute, activeTheme);
        }
    }, [theme, systemTheme, attribute]);

    const setTheme = useCallback((newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme);
        localStorage.setItem('theme', newTheme);
        setThemeState(newTheme);
    }, [storageKey]);

    const value = useMemo(() => ({
        theme,
        setTheme,
        systemTheme,
    }), [theme, setTheme, systemTheme]);

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
