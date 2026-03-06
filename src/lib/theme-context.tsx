'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
    bg: string;
    white: string;
    text: string;
    muted: string;
    border: string;
    green: string;
    greenLight: string;
    red: string;
    redLight: string;
    blue: string;
    blueLight: string;
    orange: string;
    orangeLight: string;
    purple: string;
    purpleLight: string;
    yellow: string;
    yellowLight: string;
    teal: string;
    tealLight: string;
}

const LIGHT: ThemeColors = {
    bg: "#F7F8FC",
    white: "#FFFFFF",
    text: "#1A1A2E",
    muted: "#8B8FA8",
    border: "#EAECF5",
    green: "#00C896",
    greenLight: "#E6FAF5",
    red: "#FF5A5F",
    redLight: "#FFF0F0",
    blue: "#4A90FF",
    blueLight: "#EEF4FF",
    orange: "#FF8C42",
    orangeLight: "#FFF4EE",
    purple: "#8B5CF6",
    purpleLight: "#F3F0FF",
    yellow: "#FFB800",
    yellowLight: "#FFFBEB",
    teal: "#06B6D4",
    tealLight: "#E0F7FA",
};

const DARK: ThemeColors = {
    bg: "#0F1117",
    white: "#1E2235",
    text: "#F8FAFC",
    muted: "#6B6F8A",
    border: "#2A2D42",
    green: "#00D9A5",
    greenLight: "#0D2E26",
    red: "#FF6B70",
    redLight: "#2E1516",
    blue: "#5A9CFF",
    blueLight: "#141E33",
    orange: "#FF9B5C",
    orangeLight: "#2E1E10",
    purple: "#A07BFF",
    purpleLight: "#1E1633",
    yellow: "#FFC933",
    yellowLight: "#2E2610",
    teal: "#22D3EE",
    tealLight: "#0D2830",
};

interface ThemeContextType {
    mode: ThemeMode;
    C: ThemeColors;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'light',
    C: LIGHT,
    toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('stokly-theme') as ThemeMode | null;
        if (saved === 'dark' || saved === 'light') {
            setMode(saved);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setMode('dark');
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('stokly-theme', mode);
            document.documentElement.setAttribute('data-theme', mode);
        }
    }, [mode, mounted]);

    const toggleTheme = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

    const C = mode === 'light' ? LIGHT : DARK;

    // Generate CSS variables output
    const cssVariables = Object.entries(C)
        .map(([key, value]) => `--${key}: ${value};`)
        .join('\n');

    return (
        <ThemeContext.Provider value={{ mode, C, toggleTheme }}>
            <style>{`
        :root {
          ${cssVariables}
          --card-shadow: ${mode === 'light' ? '0 2px 12px rgba(0,0,0,0.06)' : '0 4px 16px rgba(0,0,0,0.3)'};
          --overlay-bg: ${mode === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.7)'};
        }
        
        body {
            background-color: var(--bg) !important;
            color: var(--text) !important;
        }
      `}</style>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
