import projects from '../../fixtures/project/get-projects-response.json';

describe('/opportunities', () => {
	beforeEach(() => {
		cy.signIn();
		cy.visit('/opportunities');
	});

	it('Should render correctly', () => {
		cy.interceptApi('/project**', { method: 'GET' }, { body: { data: [] } }).as(
			'getProjects',
		);

		cy.wait('@getProjects');

		cy.getBySel('opportunities').should('be.visible');
		cy.getBySel('opportunities-filters').should('be.visible');
		cy.getBySel('opportunities-empty')
			.should('be.visible')
			.and('have.text', "We couldn't find any projects available");
	});

	it('Should render projects correctly', () => {
		cy.interceptApi('/project**', { method: 'GET' }, { body: projects }).as(
			'getProjects',
		);

		cy.getBySel('opportunities-list').should('be.visible');

		projects.data.forEach((projectResult) => {
			const {
				id,
				attributes: { name, tokenPrice },
			} = projectResult;

			cy.getBySel(`project-item-name-${id}`)
				.should('be.visible')
				.and('have.text', name);

			cy.getBySel(`project-item-price-${id}`)
				.should('be.visible')
				.and('have.text', `$${tokenPrice / 10 ** 7}`);

			cy.getBySel(`project-item-view-${id}`)
				.should('be.visible')
				.and('have.text', 'View');
		});
	});
});
