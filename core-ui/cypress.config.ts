import registerCodeCoverageTasks from '@cypress/code-coverage/task';
import webpack from '@cypress/webpack-preprocessor';
import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.test' });

// https://docs.cypress.io/guides/references/configuration

export default defineConfig({
	video: false,
	screenshotOnRunFailure: false,
	port: process.env.CYPRESS_HOST_PORT ? +process.env.CYPRESS_HOST_PORT : 4000,
	e2e: {
		setupNodeEvents(on, config) {
			registerCodeCoverageTasks(on, config);
			const __filename = fileURLToPath(import.meta.url);
			const __dirname = dirname(__filename);
			const options = {
				webpackOptions: {
					resolve: {
						alias: {
							'@support': path.resolve(__dirname, './cypress/support'),
							'@context': path.resolve(__dirname, './src/context'),
							'@components': path.resolve(__dirname, './src/components'),
						},
						extensions: ['.ts', '.js'],
					},
				},
				watchOptions: {},
			};
			on('file:preprocessor', webpack(options));
			return config;
		},
		baseUrl: process.env.CYPRESS_BASE_URL_PREFIX,
		specPattern: 'cypress/tests/**/*.spec.{js,jsx,ts,tsx}',
	},
	env: {
		VITE_API_URL: process.env.VITE_API_URL,
		VITE_SIMPLE_SIGNER_URL: process.env.VITE_SIMPLE_SIGNER_URL,
		VITE_STELLAR_HORIZON_URL: process.env.VITE_STELLAR_HORIZON_URL,
		VITE_REFERENCE_TOKEN_ISSUER: process.env.VITE_REFERENCE_TOKEN_ISSUER,
		VITE_REFERENCE_TOKEN_ASSET_CODE:
			process.env.VITE_REFERENCE_TOKEN_ASSET_CODE,
		VITE_ISSUER_ADDRESS: process.env.VITE_ISSUER_ADDRESS,
		VITE_STELLAR_NETWORK_PASSPHRASE:
			process.env.VITE_STELLAR_NETWORK_PASSPHRASE,
	},
});
