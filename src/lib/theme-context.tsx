'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
    bg: string;
    bgSecondary: string;
    white: string;
    text: string;
    textSecondary: string;
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
    cardShadow: string;
    overlayBg: string;
    inputBg: string;
    toastBg: string;
    toastText: string;
}

const LIGHT: ThemeColors = {
    bg: "#F7F8FC",
    bgSecondary: "#EAECF5",
    white: "#FFFFFF",
    text: "#1A1A2E",
    textSecondary: "#2D2D44",
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
    cardShadow: "0 2px 12px rgba(0,0,0,0.06)",
    overlayBg: "rgba(0,0,0,0.4)",
    inputBg: "#F7F8FC",
    toastBg: "#1A1A2E",
    toastText: "#FFFFFF",
};

const DARK: ThemeColors = {
    bg: "#0F1117",
    bgSecondary: "#1A1D2E",
    white: "#1A1D2E",
    text: "#E8E9F0",
    textSecondary: "#C4C6D4",
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
    cardShadow: "0 2px 16px rgba(0,0,0,0.3)",
    overlayBg: "rgba(0,0,0,0.65)",
    inputBg: "#141726",
    toastBg: "#E8E9F0",
    toastText: "#0F1117",
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
        }
    }, [mode, mounted]);

    const toggleTheme = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

    const C = mode === 'light' ? LIGHT : DARK;

    return (
        <ThemeContext.Provider value={{ mode, C, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
