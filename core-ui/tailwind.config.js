/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				primary: '#4BDCF1',
				['custom-green']: '#61CD82',
				['custom-grey']: '#71778E',
				['custom-medium-grey']: '#F1F4FA',
				['custom-light-grey']: '#EDF1FA',
				['custom-dark-blue']: '#1C164E',
			},
		},
	},
	plugins: [],
};
