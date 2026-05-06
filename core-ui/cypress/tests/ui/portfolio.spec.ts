import portfolio from '../../fixtures/user/get-portfolio-response.json';

describe('/portfolio', () => {
	beforeEach(() => {
		cy.signIn('wholesaleInvestor', true);
	});

	it('Should render correctly with projects', () => {
		cy.interceptApi(
			'/user/*/portfolio',
			{ method: 'GET' },
			{ fixture: 'user/get-portfolio-response.json' },
		).as('getPortfolio');

		cy.visit('/portfolio');

		cy.wait('@getPortfolio');

		cy.getBySel('header-title')
			.should('be.visible')
			.and('have.text', 'Portfolio');

		portfolio.data.forEach(({ id, attributes }) => {
			cy.getBySel(`portfolio-item-name-${id}`)
				.should('be.visible')
				.and('contain.text', attributes.name);

			cy.getBySel(`portfolio-item-symbol-${id}`)
				.should('be.visible')
				.and('contain.text', attributes.tokenSymbol);

			cy.getBySel(`portfolio-item-price-${id}`)
				.should('be.visible')
				.and('contain.text', `$${attributes.tokenPrice / 10 ** 7}`);
		});
	});

	it('Should render empty state when no projects', () => {
		cy.interceptApi('/user/*/portfolio', { method: 'GET' }, { data: [] }).as(
			'getEmptyPortfolio',
		);

		cy.visit('/portfolio');

		cy.wait('@getEmptyPortfolio');

		cy.getBySel('portfolio-empty')
			.should('be.visible')
			.and('have.text', "You haven't invested in any projects yet");
	});

	it('Should show error when fetching fails', () => {
		cy.interceptApi(
			'/user/*/portfolio',
			{ method: 'GET' },
			{ statusCode: 500 },
		).as('getPortfolioError');

		cy.visit('/portfolio');

		cy.wait('@getPortfolioError');

		cy.getBySel('toast-container').contains(
			'An error occurred while fetching your portfolio',
		);
	});

	it('Should load without requiring a wallet connection', () => {
		cy.visit('/portfolio');
		cy.url().should('include', '/portfolio');
	});
});
