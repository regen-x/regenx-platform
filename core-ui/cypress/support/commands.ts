/// <reference types="cypress" />
import userMock from '../fixtures/auth/me.json';

import {
	CODE_MIN_LENGTH,
	CODE_REQUIRED,
	CODE_TYPE,
	EMAIL_INVALID,
	EMAIL_REQUIRED,
	PASSWORD_LOWERCASE,
	PASSWORD_MIN_LENGTH,
	PASSWORD_NUMBER,
	PASSWORD_REQUIRED,
	PASSWORD_SPECIAL,
	PASSWORD_UPPERCASE,
	PHONE_NUMBER_COUNTRY_CODE,
	PHONE_NUMBER_INVALID_FORMAT,
	PHONE_REQUIRED,
} from '@components/auth/schemas/schema-errors';

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email, password)
//       drag(subject, options)
//       dismiss(subject, options)
//       visit(originalFn, url, options)
//     }
//   }
// }

Cypress.Commands.add('getBySel', (selector, ...args) => {
	return cy.get(`[data-test=${selector}]`, ...args);
});

Cypress.Commands.add('getBySelLike', (selector, ...args) => {
	return cy.get(`[data-test*=${selector}]`, ...args);
});

Cypress.Commands.add('clickLinkAndVerifyUrl', (selector, urlPart) => {
	cy.get(`[data-test="${selector}"]`).should('be.visible').click();
	cy.url().should('include', urlPart);
});

Cypress.Commands.add('getInputAndType', (selector, text) => {
	cy.get(`[data-test="${selector}"]`)
		.scrollIntoView()
		.should('be.visible')
		.focus()
		.clear()
		.type(text)
		.should('have.value', text);
});

Cypress.Commands.add('interceptApi', (endpoint, matcher, handler) => {
	const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	return cy.intercept(
		{ resourceType: /xhr|fetch/, ...matcher, url: `**${normalizedEndpoint}` },
		handler,
	);
});

Cypress.Commands.add('validateUsername', (inputSelector, errorSelector) => {
	const username = 'example@test.com';
	const badUsername = 'someusername';

	cy.getBySel(inputSelector).focus().blur();
	cy.getBySel(errorSelector).contains(EMAIL_REQUIRED);

	cy.getInputAndType(inputSelector, badUsername).blur();
	cy.getBySel(errorSelector).contains(EMAIL_INVALID);

	cy.getInputAndType(inputSelector, username);
});

Cypress.Commands.add('validatePassword', (inputSelector, errorSelector) => {
	const shortPassword = 'some';
	const uppercaseErrorPassword = '@@1secret';
	const lowercaseErrorPassword = '@1SECRET';
	const noSymbolPassword = '11Secret';
	const noNumberPassword = '@@Secret';

	cy.getBySel(inputSelector).focus().blur();
	cy.getBySel(errorSelector).contains(PASSWORD_REQUIRED);

	cy.getInputAndType(inputSelector, shortPassword).blur();
	cy.getBySel(errorSelector).contains(PASSWORD_MIN_LENGTH);

	cy.getInputAndType(inputSelector, lowercaseErrorPassword).blur();
	cy.getBySel(errorSelector).contains(PASSWORD_LOWERCASE);

	cy.getInputAndType(inputSelector, uppercaseErrorPassword).blur();
	cy.getBySel(errorSelector).contains(PASSWORD_UPPERCASE);

	cy.getInputAndType(inputSelector, noSymbolPassword).blur();
	cy.getBySel(errorSelector).contains(PASSWORD_SPECIAL);

	cy.getInputAndType(inputSelector, noNumberPassword).blur();
	cy.getBySel(errorSelector).contains(PASSWORD_NUMBER);
});

Cypress.Commands.add('validatePhoneNumber', (inputSelector, errorSelector) => {
	const noPlus = '1234567890';
	const invalidFormat = '+1-234-567-890';

	cy.getBySel(inputSelector).focus().blur();
	cy.getBySel(errorSelector).contains(PHONE_REQUIRED);

	cy.getInputAndType(inputSelector, noPlus).blur();
	cy.getBySel(errorSelector).contains(PHONE_NUMBER_COUNTRY_CODE);

	cy.getInputAndType(inputSelector, invalidFormat).blur();
	cy.getBySel(errorSelector).contains(PHONE_NUMBER_INVALID_FORMAT);

	cy.getInputAndType(inputSelector, '+61444444444');
});

Cypress.Commands.add('validateCode', (inputSelector, errorSelector) => {
	const shortCode = '12345';
	const noLetters = 'A12345';
	cy.getBySel(inputSelector).focus().blur();
	cy.getBySel(errorSelector).contains(CODE_REQUIRED);
	cy.getInputAndType(inputSelector, shortCode).blur();
	cy.getBySel(errorSelector).contains(CODE_MIN_LENGTH);
	cy.getInputAndType(inputSelector, noLetters).blur();
	cy.getBySel(errorSelector).contains(CODE_TYPE);
});

Cypress.Commands.add('signIn', (userType = 'wealthManager', includeWallet = true) => {
	const users = {
		wealthManager: {
			id: '38c4f729-1e46-4f7f-a099-6116e2cf62e1',
			email: 'example@test.com',
			fullName: 'Jhon Doe',
			birthdate: '2025-01-01',
			phoneNumber: '+543496522688',
			role: 'regular',
			type: 'wealthManager',
			walletAddress: 'GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
		},
		wholesaleInvestor: {
			id: '16',
			email: 'investor@test.com',
			fullName: 'RegenX Investor',
			birthdate: '2025-01-01',
			phoneNumber: '+61444444444',
			role: 'regular',
			type: 'wholesaleInvestor',
			walletAddress: 'GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
		},
		climateDeveloper: {
			id: '21',
			email: 'developer@test.com',
			fullName: 'RegenX Developer',
			birthdate: '2025-01-01',
			phoneNumber: '+61444444445',
			role: 'regular',
			type: 'climateDeveloper',
			walletAddress: 'GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
		},
		admin: {
			id: '1',
			email: 'admin@test.com',
			fullName: 'RegenX Admin',
			birthdate: '2025-01-01',
			phoneNumber: '+61444444446',
			role: 'admin',
			type: 'admin',
			walletAddress: 'GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
		},
	};

	const user = {
		...(users[String(userType)] || users.wealthManager),
	};

	if (!includeWallet) {
		delete user.walletAddress;
	}

	cy.window().then((win) => {
		win.document.cookie = 'accessToken=test-access-token; path=/';
		win.document.cookie = 'refreshToken=test-refresh-token; path=/';
		win.document.cookie = `${encodeURIComponent('username')}=${encodeURIComponent(user.email)}; path=/`;
		win.localStorage.setItem('accessToken', 'test-access-token');
		win.localStorage.setItem('refreshToken', 'test-refresh-token');
		win.localStorage.setItem(
			'user',
			JSON.stringify({
				state: {
					user,
					onboarding: {},
				},
				version: 4,
			}),
		);
		win.localStorage.setItem('userRole', user.role);
	});

	cy.interceptApi('/user/me', { method: 'GET' }, {
		body: {
			data: {
				id: String(user.id),
				type: 'user',
				attributes: user,
			},
		},
	}).as('me');
});


Cypress.Commands.add('connectWallet', (publicKey, simpleSignerUrl) => {
	cy.visit('/cash-account');
	cy.window().then((win) => {
		win.localStorage.setItem(
			'stellar',
			JSON.stringify({
				state: {
					publicKey,
					selectedClientPublicKey: '',
				},
				version: 0,
			}),
		);
	});
	cy.reload();
});

Cypress.Commands.add('visitOffers', () => {
	cy.interceptApi(
		'/project',
		{ method: 'GET' },
		{ fixture: 'project/get-projects-response.json' },
	).as('getProject');

	cy.interceptApi(
		'/offer?page[number]=1&filter[isActive]=true&filter[excludeAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
		{ method: 'GET' },
		{ fixture: 'offer/get-offers-response.json' },
	).as('getAllOffers');

	cy.visit('/offers');

	cy.wait(['@getProject', '@getAllOffers']);
});
