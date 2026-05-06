import {
	CONFIRMATION_SENT_MESSAGE,
	SIGN_IN_SUCCESS_MESSAGE,
	SIGN_UP_SUCCESS_MESSAGE,
} from '@context/auth-messages';

import { PASSWORD_REQUIRED } from '@components/auth/schemas/schema-errors';

describe('/auth', () => {
	const name = 'John Doe';
	const username = 'example@test.com';
	const password = 'Supersecret2024~';
	const code = '123456';
	const phone = '+61444444444';
	const dob = '2000-01-01';

	describe('/auth/sign-in', () => {
		beforeEach(() => {
			cy.visit('/auth/sign-in');
		});
		it('Should be able to sign-in', () => {
			cy.signIn();
			cy.getBySel('toast-container').contains(SIGN_IN_SUCCESS_MESSAGE);
		});

		it('Should be able to visit sign-up', () => {
			cy.clickLinkAndVerifyUrl('link-sign-up', '/auth/sign-up');
		});
		it('Username field validation', () => {
			cy.validateUsername('sign-in-username', 'form-input-error-email');
		});
		it('Password field validation', () => {
			cy.getBySel('sign-in-password').focus().blur();
			cy.getBySel('form-input-error-password').contains(PASSWORD_REQUIRED);
		});
		it('If the user does not exist, it should show an error', () => {
			const errorResponse = {
				error: {
					detail: `${username} was not found`,
					source: { pointer: '/api/v1/auth/sign-in' },
					status: '404',
					title: 'Username Not Found',
				},
			};
			cy.getInputAndType('sign-in-username', username);
			cy.getInputAndType('sign-in-password', password);
			cy.interceptApi(
				'/auth/sign-in',
				{ method: 'POST' },
				{ body: errorResponse, statusCode: +errorResponse.error.status },
			).as('error-sign-in');
			cy.getBySel('sign-in-submit').click();
			cy.wait('@error-sign-in');
			cy.getBySel('toast-container').contains(errorResponse.error.detail);
		});
		it('If the password is incorrect, it should show an error', () => {
			const errorResponse = {
				error: {
					detail: 'Invalid username or password',
					source: { pointer: '/api/v1/auth/sign-in' },
					status: '401',
					title: 'Unauthorized',
				},
			};
			cy.getInputAndType('sign-in-username', username);
			cy.getInputAndType('sign-in-password', password);
			cy.interceptApi(
				'/auth/sign-in',
				{ method: 'POST' },
				{ body: errorResponse, statusCode: +errorResponse.error.status },
			).as('error-sign-in');
			cy.getBySel('sign-in-submit').click();
			cy.wait('@error-sign-in');
			cy.getBySel('toast-container').contains(errorResponse.error.detail);
		});
	});

	describe('/auth/sign-up', () => {
		beforeEach(() => {
			cy.visit('/auth/sign-up');
		});
		it('Should be able to sign-up', () => {
			cy.getInputAndType('sign-up-name', name);
			cy.getInputAndType('sign-up-username', username);
			cy.getInputAndType('sign-up-password', password);
			cy.getInputAndType('sign-up-phone', phone);
			cy.getInputAndType('sign-up-dob', dob);
			cy.getInputAndType('sign-up-confirm-password', password);
			cy.getBySel('sign-up-type').select(1);
			cy.interceptApi(
				'/auth/sign-up',
				{ method: 'POST' },
				{ fixture: 'auth/sign-up.json' },
			).as('sign-up');
			cy.getBySel('sign-up-submit').click();
			cy.wait('@sign-up');
			cy.getBySel('toast-container').contains(SIGN_UP_SUCCESS_MESSAGE);
			cy.getBySel('toast-container').contains(CONFIRMATION_SENT_MESSAGE);
		});
		it('Should be able to visit sign-in', () => {
			cy.clickLinkAndVerifyUrl('link-sign-in', '/auth/sign-in');
		});
		it('Username field validation', () => {
			cy.validateUsername('sign-up-username', 'form-input-error-email');
		});
		it('Password field validation', () => {
			cy.validatePassword('sign-up-password', 'form-input-error-password');
		});
		it('Phone number field validation', () => {
			cy.validatePhoneNumber('sign-up-phone', 'form-input-error-phone-number');
		});
		it('If the user already exists, it should show an error', () => {
			const errorResponse = {
				error: {
					detail: 'User already signed up',
					source: { pointer: '/api/v1/auth/sign-up' },
					status: '400',
					title: 'Bad Request',
				},
			};
			cy.getInputAndType('sign-up-name', name);
			cy.getInputAndType('sign-up-username', username);
			cy.getInputAndType('sign-up-password', password);
			cy.getInputAndType('sign-up-phone', phone);
			cy.getInputAndType('sign-up-dob', dob);
			cy.getInputAndType('sign-up-confirm-password', password);
			cy.getBySel('sign-up-type').select(1);
			cy.interceptApi(
				'/auth/sign-up',
				{ method: 'POST' },
				{ body: errorResponse, statusCode: +errorResponse.error.status },
			).as('error-sign-up');
			cy.getBySel('sign-up-submit').click();
			cy.wait('@error-sign-up');
			cy.getBySel('toast-container').contains(errorResponse.error.detail);
		});
	});

	describe('/auth/forgot-password', () => {
		beforeEach(() => {
			cy.visit('/auth/forgot-password');
		});
		it('Should be able to use the forgot password form', () => {
			const successResponse = {
				data: {
					attributes: {
						success: true,
						message: 'Password reset instructions have been sent',
					},
				},
			};
			cy.visit('/auth/forgot-password');
			cy.getInputAndType('forgot-password-username', username);
			cy.interceptApi(
				'/auth/forgot-password',
				{ method: 'POST' },
				{ body: successResponse },
			).as('forgot-password');
			cy.getBySel('forgot-password-submit').click();
			cy.wait('@forgot-password');
			cy.getBySel('toast-container').contains(
				successResponse.data.attributes.message,
			);
		});
		it('Should be able to visit signup', () => {
			cy.clickLinkAndVerifyUrl('link-sign-up', '/auth/sign-up');
		});
		it('Username field validation', () => {
			cy.validateUsername('forgot-password-username', 'form-input-error-email');
		});
		it('If the user does not exist, it should show an error', () => {
			const errorResponse = {
				error: {
					detail: `${username} was not found`,
					source: { pointer: '/api/v1/auth/sign-in' },
					status: '404',
					title: 'Username Not Found',
				},
			};
			cy.getInputAndType('forgot-password-username', username);
			cy.interceptApi(
				'/auth/forgot-password',
				{ method: 'POST' },
				{ body: errorResponse, statusCode: +errorResponse.error.status },
			).as('error-forgot-password');
			cy.getBySel('forgot-password-submit').click();
			cy.wait('@error-forgot-password');
			cy.getBySel('toast-container').contains(errorResponse.error.detail);
		});
	});

	describe('/auth/verify-email', () => {
		beforeEach(() => {
			cy.visit('/auth/verify-email');
		});
		it('Should show verify email content', () => {
			cy.contains('Verify email');
			cy.contains("We've sent a verification link to your email");
		});
		it('Should be able to visit resend confirmation code', () => {
			cy.clickLinkAndVerifyUrl(
				'link-resend-confirmation-code',
				'/auth/resend-confirmation-code',
			);
		});
		it('Should be able to visit sign in', () => {
			cy.clickLinkAndVerifyUrl('link-sign-in', '/auth/sign-in');
		});
	});

	describe('/auth/confirm-password', () => {
		beforeEach(() => {
			cy.visit('/auth/confirm-password');
		});
		it('Should be able to use the confirm password form', () => {
			const successResponse = {
				data: {
					attributes: {
						success: true,
						message: 'Your password has been correctly updated',
					},
				},
			};
			cy.getInputAndType('confirm-password-username', username);
			cy.getInputAndType('confirm-password-password', password);
			cy.getInputAndType('confirm-password-code', code);
			cy.interceptApi(
				'/auth/confirm-password',
				{ method: 'POST' },
				{ body: successResponse },
			).as('confirm-password');

			cy.getBySel('confirm-password-submit').click();
			cy.wait('@confirm-password');
			cy.getBySel('toast-container').contains(
				successResponse.data.attributes.message,
			);
		});
		it('Should be able to visit sign up', () => {
			cy.clickLinkAndVerifyUrl('link-sign-up', '/auth/sign-up');
		});
		it('Username field validation', () => {
			cy.validateUsername(
				'confirm-password-username',
				'form-input-error-email',
			);
		});
		it('Password field validation', () => {
			cy.validatePassword(
				'confirm-password-password',
				'form-input-error-password',
			);
		});
		it('Code field validation', () => {
			cy.validateCode('confirm-password-code', 'form-input-error-code');
		});
		it('Should fill the input fields with the values from the URL', () => {
			cy.visit(`/auth/confirm-password?email=${username}&code=${code}`);
			cy.getBySel('confirm-password-username').should('have.value', username);
			cy.getBySel('confirm-password-code').should('have.value', code);
		});
		it('If the user does not exist, it should show an error', () => {
			const errorResponse = {
				error: {
					detail: `${username} was not found`,
					source: { pointer: '/api/v1/auth/sign-in' },
					status: '404',
					title: 'Username Not Found',
				},
			};
			cy.interceptApi(
				'/auth/confirm-password',
				{ method: 'POST' },
				{ body: errorResponse, statusCode: +errorResponse.error.status },
			).as('error-confirm-password');
			cy.getInputAndType('confirm-password-username', username);
			cy.getInputAndType('confirm-password-password', password);
			cy.getInputAndType('confirm-password-code', code);
			cy.getBySel('confirm-password-submit').click();
			cy.wait('@error-confirm-password');
			cy.getBySel('toast-container').contains(errorResponse.error.detail);
		});
		it('If the code is invalid, it should show an error', () => {
			const errorResponse = {
				error: {
					detail: 'Incorrect confirmation code',
					source: { pointer: '/api/v1/auth/confirm-password' },
					status: '401',
					title: 'Unauthorized',
				},
			};
			cy.interceptApi(
				'/auth/confirm-password',
				{ method: 'POST' },
				{ body: errorResponse, statusCode: +errorResponse.error.status },
			).as('error-confirm-password');
			cy.getInputAndType('confirm-password-username', username);
			cy.getInputAndType('confirm-password-password', password);
			cy.getInputAndType('confirm-password-code', code);
			cy.getBySel('confirm-password-submit').click();
			cy.wait('@error-confirm-password');
			cy.getBySel('toast-container').contains(errorResponse.error.detail);
		});
	});

	describe('/auth/resend-confirmation-code', () => {
		beforeEach(() => {
			cy.visit('/auth/resend-confirmation-code');
		});
		it('Should be able to use the resend confirmation code form', () => {
			const successResponse = {
				data: {
					attributes: {
						success: true,
						message: 'A new code has been sent to your e-mail address',
					},
				},
			};
			cy.getInputAndType('resend-confirmation-code-username', username);
			cy.interceptApi(
				'/auth/resend-confirmation-code',
				{ method: 'POST' },
				{ body: successResponse },
			).as('resend-confirmation-code');
			cy.getBySel('resend-confirmation-code-submit').click();
			cy.wait('@resend-confirmation-code');
			cy.getBySel('toast-container').contains(
				successResponse.data.attributes.message,
			);
		});
		it('Should be able to visit sign up', () => {
			cy.clickLinkAndVerifyUrl('link-sign-up', '/auth/sign-up');
		});
		it('Username field validation', () => {
			cy.validateUsername(
				'resend-confirmation-code-username',
				'form-input-error-email',
			);
		});
		it('If the user does not exist, it should show an error', () => {
			const errorResponse = {
				error: {
					detail: `${username} was not found`,
					source: { pointer: '/api/v1/auth/resend-confirmation-code' },
					status: '404',
					title: 'Username Not Found',
				},
			};
			cy.getInputAndType('resend-confirmation-code-username', username);
			cy.interceptApi(
				'/auth/resend-confirmation-code',
				{ method: 'POST' },
				{ body: errorResponse, statusCode: +errorResponse.error.status },
			).as('error-resend-confirmation-code');
			cy.getBySel('resend-confirmation-code-submit').click();
			cy.wait('@error-resend-confirmation-code');
			cy.getBySel('toast-container').contains(errorResponse.error.detail);
		});
	});

	describe('RequireAuth', () => {
		it('If the user is logged in, it should let it access a protected resource', () => {
			cy.signIn();
			cy.visit('/dashboard');
			cy.url().should('include', '/dashboard');
		});
		it('If the access token expires, it should refresh the access token', () => {
			cy.signIn();
			cy.clearCookie('accessToken');
			cy.interceptApi(
				'/auth/refresh',
				{ method: 'POST' },
				{ fixture: '/auth/refresh.json' },
			).as('refresh');
			cy.visit('/dashboard');
			cy.wait('@refresh');
			cy.url().should('include', '/dashboard');
		});
		it('If the user is not logged in, it should not let it access a protected resource', () => {
			cy.visit('/dashboard');
			cy.url().should('not.include', '/dashboard');
		});
	});

	describe('Public Routes', () => {
		it('If the user is logged in, it should not let it access a public layout resource', () => {
			cy.signIn();
			cy.visit('/');
			cy.url().should('include', '/dashboard');
		});
	});
});
