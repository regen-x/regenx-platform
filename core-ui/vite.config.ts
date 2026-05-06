import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import istanbul from 'vite-plugin-istanbul';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import tsconfig from './tsconfig.json';

// automatically map path aliases
const rawAlias = tsconfig.compilerOptions.paths;
const alias = {};

for (const x in rawAlias) {
	alias[x.replace('/*', '')] = rawAlias[x].map((p) =>
		path.resolve(__dirname, p.replace('/*', '')),
	);
}

// https://vitejs.dev/config/
export default ({ mode }) => {
	process.env = loadEnv(mode, process.cwd(), '');
	return defineConfig({
		resolve: {
			alias,
		},
		plugins: [
			react(),
			istanbul({
				cypress: true,
				requireEnv: false,
			}),
		],
		server: {
			host: true,
			port: process.env.PORT ? +process.env.PORT : 5173,
			allowedHosts: ['staging.app.regenx.io'],
			watch: {
				ignored: ['**/coverage/**', '**/.nyc_output/**', '**/dist/**'],
			},
		},
	});
};
