// https://docs.cypress.io/guides/overview/why-cypress
describe('Home page', () => {
	beforeEach(() => {
		cy.visit('/');
	});

	it('Should render correctly', () => {
		cy.getBySel('regen-x-logo').should('be.visible');
		cy.getBySel('log-in').should('be.visible').and('have.text', 'Log In');
	});
});
