import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import './index.css';

import {
	applyThemeToDom,
	getStoredTheme,
	useThemeStore,
} from '@/store/theme.store';

import router from '@configs/react-router';

applyThemeToDom(getStoredTheme());

function ThemeBootstrap() {
	const theme = useThemeStore((state) => state.theme);

	React.useEffect(() => {
		applyThemeToDom(theme === 'dark' ? 'dark' : getStoredTheme());
	}, [theme]);

	return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ThemeBootstrap />
	</React.StrictMode>,
);
