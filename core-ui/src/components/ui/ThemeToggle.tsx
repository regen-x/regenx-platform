import { Moon, Sun } from 'lucide-react';

import { RegenxTheme, useThemeStore } from '@/store/theme.store';

const options: Array<{
	value: RegenxTheme;
	label: string;
	icon: typeof Sun;
}> = [
	{ value: 'light', label: 'Light', icon: Sun },
	{ value: 'dark', label: 'Dark', icon: Moon },
];

export default function ThemeToggle() {
	const theme = useThemeStore((state) => state.theme);
	const setTheme = useThemeStore((state) => state.setTheme);

	return (
		<div className="theme-toggle-shell" role="radiogroup" aria-label="Theme">
			{options.map((option) => {
				const Icon = option.icon;
				const isActive = theme === option.value;

				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={isActive}
						onClick={() => setTheme(option.value)}
						className={`theme-toggle-option ${isActive ? 'is-active' : ''}`}
					>
						<Icon className="h-4 w-4" />
						<span>{option.label}</span>
					</button>
				);
			})}
		</div>
	);
}
