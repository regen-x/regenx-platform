import projects from '../../fixtures/project/get-projects-response.json';
import users from '../../fixtures/user/get-users-response.json';

describe('/dashboard', () => {
	describe('Should render correctly', () => {
		beforeEach(() => {
			cy.signIn();
			cy.visit('/dashboard');
		});

		it('Should render correctly', () => {
			cy.getBySel('dashboard').should('be.visible');
		});
	});

	describe('Should render header correctly', () => {
		beforeEach(() => {
			cy.signIn();
			cy.visit('/dashboard');
		});

		it('Should render correctly with user type', () => {
			const expectedUserTypeLabel = 'Wealth Manager';
			cy.getBySel('header').should('be.visible');
			cy.getBySel('header-title')
				.should('be.visible')
				.and('have.text', 'Dashboard');
			cy.getBySel('header-description')
				.should('be.visible')
				.and('have.text', expectedUserTypeLabel);
		});
	});

	describe('The projects card', () => {
		beforeEach(() => {
			cy.signIn('climateDeveloper');
		});

		it('Should render correctly with items', () => {
			cy.interceptApi('/project**', { method: 'GET' }, { body: projects }).as(
				'getProjects',
			);

			cy.visit('/dashboard');

			cy.wait('@getProjects');

			cy.getBySel('dashboard-card-user-projects').should('be.visible');

			projects.data.forEach((projectResult) => {
				const {
					id,
					attributes: {
						name,
						createdAt,
						tokenSymbol,
						tokenPrice,
						fundingGoal,
						tokenSupply,
					},
				} = projectResult;

				cy.getBySel(`project-item-name-${id}`)
					.should('be.visible')
					.and('include.text', name);

				cy.getBySel(`project-item-date-${id}`)
					.should('be.visible')
					.and('have.text', new Date(createdAt).toLocaleString());

				cy.getBySel(`project-item-symbol-${id}`)
					.should('be.visible')
					.and('have.text', tokenSymbol);

				cy.getBySel(`project-item-price-${id}`)
					.should('be.visible')
					.and('have.text', `$${tokenPrice / 10 ** 7}`);

				cy.getBySel(`project-item-goal-${id}`)
					.should('be.visible')
					.and('have.text', `$${fundingGoal.toFixed(2)}`);

				cy.getBySel(`project-item-supply-${id}`)
					.should('be.visible')
					.and('have.text', tokenSupply / 10 ** 7);

				cy.getBySel(`project-item-properties-${id}`)
					.should('be.visible')
					.and('have.text', 'View');
			});
		});

		it('Should render correctly without items', () => {
			cy.interceptApi(
				'/project**',
				{ method: 'GET' },
				{ body: { data: [] } },
			).as('getProjects');

			cy.visit('/dashboard');

			cy.wait('@getProjects');

			cy.getBySel('dashboard-card-user-projects').should('be.visible');

			cy.getBySel('dashboard-card-empty-user-projects')
				.should('be.visible')
				.and('have.text', "We couldn't find any recent projects");
		});
	});

	describe('The clients card', () => {
		it('Should render correctly with items', () => {
			cy.signIn('wealthManager');
			cy.interceptApi('/user**', { method: 'GET' }, { body: users }).as(
				'getClients',
			);

			cy.visit('/dashboard');

			cy.wait('@getClients');

			cy.getBySel('dashboard-card-user-clients').should('be.visible');

			users.data.forEach((userResult) => {
				const {
					id,
					attributes: { fullName },
				} = userResult;

				cy.getBySel(`client-item-name-${id}`)
					.should('be.visible')
					.and('include.text', fullName);

				cy.getBySel(`client-item-properties-${id}`)
					.should('be.visible')
					.and('have.text', 'Select client');
			});
		});

		it('Should render correctly without items', () => {
			cy.signIn('wealthManager');
			cy.interceptApi('/user**', { method: 'GET' }, { body: { data: [] } }).as(
				'getUsers',
			);

			cy.visit('/dashboard');

			cy.wait('@getUsers');

			cy.getBySel('dashboard-card-user-clients').should('be.visible');

			cy.getBySel('dashboard-card-empty-user-clients')
				.should('be.visible')
				.and('have.text', "We couldn't find any clients");
		});

		it('Should display a message if the user has not connected their wallet', () => {
			cy.signIn('wealthManager', false);

			cy.interceptApi('/user**', { method: 'GET' }, { body: users }).as(
				'getClients',
			);

			cy.visit('/dashboard');

			cy.wait('@getClients');

			cy.getBySel('connect-wallet-message').should('be.visible');
		});
	});

	describe('The create project modal', () => {
		const testPublicKey =
			'GAAVOJV4IFB6GVVVUOO3RGNXCI6DKIY45QQJTIZO553PYQBL7MWTN7TA';

		it('Should allow to create a project when the user is a climate developer', () => {
			cy.interceptApi(
				'/project**',
				{ method: 'GET' },
				{ body: { data: [] } },
			).as('getProjects');
			cy.interceptApi(
				'/project',
				{ method: 'POST' },
				{ fixture: 'project/get-project-response.json' },
			).as('createProject');

			const tomorrowDate = new Date();
			tomorrowDate.setDate(tomorrowDate.getDate() + 1);
			const nextWeekDate = new Date();
			nextWeekDate.setDate(nextWeekDate.getDate() + 7);

			cy.signIn('climateDeveloper');
			cy.wait('@getProjects');
			cy.getBySel('dashboard-create-project-action').click();
			cy.getBySel('create-project-modal').should('be.visible');
			cy.getInputAndType('create-project-name', 'My project');
			cy.getInputAndType('create-project-description', 'My description');
			cy.getInputAndType('create-project-location', 'My location');
			cy.getInputAndType('create-project-funding-goal', '100');
			cy.getInputAndType(
				'create-project-start-date',
				tomorrowDate.toISOString().split('T')[0],
			);
			cy.getInputAndType(
				'create-project-end-date',
				nextWeekDate.toISOString().split('T')[0],
			);
			cy.getInputAndType('create-project-climate-impact', '100');
			cy.getInputAndType('create-project-token-supply', '100');
			cy.getInputAndType('create-project-token-price', '1');
			cy.getInputAndType('create-project-token-symbol', 'MYTOKEN');
			cy.getInputAndType('create-project-owner-address', testPublicKey);
			cy.getBySel('create-project-submit').click({ force: true });
			cy.wait('@createProject');
			cy.getBySel('create-project-modal').should('not.exist');
			cy.getBySel('toast-container').contains('Project created successfully');
		});

		it('Should display an error when the project creation request fails', () => {
			const errorResponse = {
				error: {
					detail: 'There was an error creating the project',
					source: { pointer: '/api/v1/project' },
					status: '500',
					title: 'Internal Server Error',
				},
			};

			cy.interceptApi(
				'/project**',
				{ method: 'GET' },
				{ body: { data: [] } },
			).as('getProjects');
			cy.interceptApi(
				'/project',
				{ method: 'POST' },
				{ statusCode: 500, body: errorResponse },
			).as('createProjectError');

			const tomorrowDate = new Date();
			tomorrowDate.setDate(tomorrowDate.getDate() + 1);
			const nextWeekDate = new Date();
			nextWeekDate.setDate(nextWeekDate.getDate() + 7);

			cy.signIn('climateDeveloper');
			cy.wait('@getProjects');
			cy.getBySel('dashboard-create-project-action').click();
			cy.getBySel('create-project-modal').should('be.visible');
			cy.getInputAndType('create-project-name', 'My project');
			cy.getInputAndType('create-project-description', 'My description');
			cy.getInputAndType('create-project-location', 'My location');
			cy.getInputAndType('create-project-funding-goal', '100');
			cy.getInputAndType(
				'create-project-start-date',
				tomorrowDate.toISOString().split('T')[0],
			);
			cy.getInputAndType(
				'create-project-end-date',
				nextWeekDate.toISOString().split('T')[0],
			);
			cy.getInputAndType('create-project-climate-impact', '100');
			cy.getInputAndType('create-project-token-supply', '100');
			cy.getInputAndType('create-project-token-price', '1');
			cy.getInputAndType('create-project-token-symbol', 'MYTOKEN');
			cy.getInputAndType('create-project-owner-address', testPublicKey);
			cy.getBySel('create-project-submit').click({ force: true });
			cy.wait('@createProjectError');
			cy.getBySel('create-project-modal').should('be.visible');
			cy.getBySel('toast-container').contains(errorResponse.error.detail);
		});

		it('Should not display the project creation modal if the project fetching request fails', () => {
			cy.interceptApi('/project**', { method: 'GET' }, { statusCode: 500 }).as(
				'getProjectsError',
			);
			cy.signIn('climateDeveloper');
			cy.wait('@getProjectsError');
			cy.getBySel('create-project-modal').should('not.exist');
		});

		it('Should not allow empty fields', () => {
			cy.interceptApi(
				'/project**',
				{ method: 'GET' },
				{ body: { data: [] } },
			).as('getProjects');
			cy.signIn('climateDeveloper');
			cy.wait('@getProjects');
			cy.getBySel('dashboard-create-project-action').click();
			cy.getBySel('create-project-modal').should('be.visible');
			cy.getBySel('create-project-submit').click({ force: true });

			cy.getBySel('form-input-error-name')
				.scrollIntoView()
				.should('be.visible');
			cy.getBySel('form-input-error-description')
				.scrollIntoView()
				.should('be.visible');
			cy.getBySel('form-input-error-location')
				.scrollIntoView()
				.should('be.visible');
			cy.getBySel('form-input-error-fundingGoal')
				.scrollIntoView()
				.should('be.visible');
			cy.getBySel('form-input-error-startDate')
				.scrollIntoView()
				.should('be.visible');
			cy.getBySel('form-input-error-endDate')
				.scrollIntoView()
				.should('be.visible');
			cy.getBySel('form-input-error-climateImpact')
				.scrollIntoView()
				.should('be.visible');
			cy.getBySel('form-input-error-tokenSupply')
				.scrollIntoView()
				.should('be.visible');
			cy.getBySel('form-input-error-tokenPrice')
				.scrollIntoView()
				.should('be.visible');
			cy.getBySel('form-input-error-tokenSymbol')
				.scrollIntoView()
				.should('be.visible');
			cy.getBySel('form-input-error-ownerAddress')
				.scrollIntoView()
				.should('be.visible');
		});

		it('Should validate the start date and end date', () => {
			cy.interceptApi(
				'/project**',
				{ method: 'GET' },
				{ body: { data: [] } },
			).as('getProjects');

			const todayDate = new Date().toISOString().split('T')[0];
			const yesterdayDate = new Date();
			yesterdayDate.setDate(yesterdayDate.getDate() - 1);

			cy.signIn('climateDeveloper');
			cy.wait('@getProjects');
			cy.getBySel('dashboard-create-project-action').click();
			cy.getBySel('create-project-modal').should('be.visible');
			cy.getInputAndType('create-project-start-date', todayDate);
			cy.getInputAndType('create-project-end-date', todayDate);
			cy.getBySel('create-project-submit').click({ force: true });
			cy.getBySel('form-input-error-startDate')
				.should('be.visible')
				.and('have.text', 'Start date must be before end date');
			cy.getBySel('form-input-error-endDate')
				.should('be.visible')
				.and('have.text', 'End date must be after start date');
			cy.getInputAndType(
				'create-project-start-date',
				yesterdayDate.toISOString().split('T')[0],
			);
			cy.getBySel('form-input-error-startDate')
				.should('be.visible')
				.and('have.text', 'Start date must be in the future');
			cy.getBySel('form-input-error-endDate')
				.should('be.visible')
				.and('have.text', 'End date must be in the future');
		});

		it('Should validate the token symbol', () => {
			cy.interceptApi(
				'/project**',
				{ method: 'GET' },
				{ body: { data: [] } },
			).as('getProjects');
			cy.signIn('climateDeveloper');
			cy.wait('@getProjects');
			cy.getBySel('dashboard-create-project-action').click();
			cy.getBySel('create-project-modal').should('be.visible');
			cy.getInputAndType('create-project-token-symbol', 'My');
			cy.getBySel('create-project-submit').click({ force: true });
			cy.getBySel('form-input-error-tokenSymbol')
				.scrollIntoView()
				.should('be.visible')
				.and('have.text', 'Token symbol should have at least 4 characters');
			cy.getInputAndType('create-project-token-symbol', 'MyTokenExample');
			cy.getBySel('form-input-error-tokenSymbol')
				.scrollIntoView()
				.should('be.visible')
				.and('have.text', 'Token symbol should have at most 12 characters');
			cy.getInputAndType('create-project-token-symbol', 'My-token');
			cy.getBySel('form-input-error-tokenSymbol')
				.scrollIntoView()
				.should('be.visible')
				.and('have.text', 'Token symbol must be alphanumeric (a-z, A-Z, 0-9)');
		});

		it('Should validate the owner address', () => {
			cy.interceptApi(
				'/project**',
				{ method: 'GET' },
				{ body: { data: [] } },
			).as('getProjects');
			cy.signIn('climateDeveloper');
			cy.wait('@getProjects');
			cy.getBySel('dashboard-create-project-action').click();
			cy.getBySel('create-project-modal').should('be.visible');
			cy.getInputAndType('create-project-owner-address', 'My');
			cy.getBySel('create-project-submit').click({ force: true });
			cy.getBySel('form-input-error-ownerAddress')
				.scrollIntoView()
				.should('be.visible')
				.and('have.text', 'Must be a valid Stellar public key');
		});

		it('Should open the create project modal when the create project button is clicked', () => {
			cy.interceptApi('/project**', { method: 'GET' }, { body: projects }).as(
				'getProjects',
			);
			cy.signIn('climateDeveloper');
			cy.wait('@getProjects');
			cy.getBySel('create-project-modal').should('not.exist');
			cy.getBySel('dashboard-create-project-action').click();
			cy.getBySel('create-project-modal').should('be.visible');
		});
	});
});
