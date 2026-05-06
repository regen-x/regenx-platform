import { create } from 'zustand';

export type RegenxTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'regenx_theme';

export function applyThemeToDom(theme: RegenxTheme) {
	if (typeof document === 'undefined') return;
	document.documentElement.setAttribute('data-theme', theme);
}

export function getStoredTheme(): RegenxTheme {
	if (typeof window === 'undefined') return 'light';
	const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
	return stored === 'dark' ? 'dark' : 'light';
}

type ThemeState = {
	theme: RegenxTheme;
	setTheme: (theme: RegenxTheme) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
	theme: getStoredTheme(),
	setTheme: (theme) => {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(THEME_STORAGE_KEY, theme);
		}
		applyThemeToDom(theme);
		set({ theme });
	},
}));
