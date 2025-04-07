'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

type Theme = 'light' | 'dark';

export const themes: ReadonlyArray<Theme> = [
  'light',
  'dark',
];

const ThemeContext: React.Context<{
	theme: Theme,
	setTheme: (theme: Theme) => void,
	rotateTheme: () => void,
}> = createContext({
    theme: 'dark' as Theme,
    setTheme: (() => {}) as ((theme: Theme) => void),
    rotateTheme: () => {},
});

interface PageContentProps {
	children: React.ReactNode;
}

export function PageContent({ children }: PageContentProps) {
	const [ theme, setTheme ] = useState<Theme>('dark');
    const [ isMounted, setIsMounted ] = useState(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null;

        if(storedTheme && themes.includes(storedTheme))
            setTheme(storedTheme);

        setIsMounted(true);
    }, []);

	const setContextTheme = (theme: Theme) => {
		localStorage.setItem('theme', theme);
		setTheme(theme);
	};

	const rotateTheme = () => {
		const currentThemeIndex = themes.indexOf(theme);
		const nextThemeIndex = (currentThemeIndex + 1) % themes.length;
		const nextTheme = themes[nextThemeIndex];
		localStorage.setItem('theme', nextTheme);
		setTheme(nextTheme);
	};

    if(!isMounted) return;

	return (
		<ThemeContext.Provider value={{ theme, setTheme: setContextTheme, rotateTheme }}>
			<div className={`theme-${theme} flex min-h-screen font-sans`}>
				<div
					className={`min-h-full min-w-full bg-background text-foreground duration-300 transition-colors`}
				>
					{children}
				</div>
			</div>
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
