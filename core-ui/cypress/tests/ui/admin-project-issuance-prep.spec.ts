const buildProject = (overrides = {}) => ({
	id: '101',
	name: 'Little Growling Cafe Battery',
	projectType: 'Battery',
	stage: 'Structuring',
	jurisdiction: 'Australia',
	status: 'approved',
	payloadJson: {
		form: {
			projectName: 'Little Growling Cafe Battery',
			projectType: 'Battery',
			stage: 'Structuring',
			jurisdiction: 'Australia',
		},
	},
	createdAt: '2026-04-20T00:00:00.000Z',
	updatedAt: '2026-04-22T00:00:00.000Z',
	generatesCarbonCredits: false,
	...overrides,
});

const buildSpv = (overrides = {}) => ({
	id: 501,
	name: 'Little Growling Cafe Battery SPV',
	legalEntityName: 'Little Growling Cafe Battery SPV',
	jurisdiction: 'Australia',
	structureType: 'MIS',
	status: 'draft',
	notes: null,
	sponsorEntityId: 41,
	sponsorEntityName: 'Eliot Energy',
	custodyModel: 'regenx_custody',
	projectId: 101,
	linkedProjectName: 'Little Growling Cafe Battery',
	createdAt: '2026-04-22T00:00:00.000Z',
	updatedAt: '2026-04-22T00:00:00.000Z',
	readiness: {
		status: 'blocked',
		requiredRolesComplete: false,
		custodyComplete: false,
		issuanceReady: false,
		blockingIssues: [
			'Missing required linked party: Trustee',
			'Custody incomplete',
		],
	},
	linkedParties: [],
	roleCoverage: {
		approved: 1,
		suggested: 1,
		missing: 2,
	},
	...overrides,
});

const buildSummary = (overrides = {}) => ({
	projectId: 101,
	sponsorEntity: {
		id: 41,
		entityName: 'Eliot Energy',
		tradingName: null,
		status: 'ready',
		jurisdiction: 'Australia',
	},
	linkedSpv: null,
	walletAlignment: {
		custodyMode: 'regenx_custody',
		proceedsWalletAddress: null,
		issuerWalletAddress: null,
		distributionWalletAddress: null,
		matchesStructure: false,
		issues: ['Custody incomplete'],
	},
	readiness: {
		status: 'blocked',
		requiredRolesComplete: false,
		custodyComplete: false,
		issuanceReady: false,
		blockingIssues: [
			'Missing required linked party: Trustee',
			'Custody incomplete',
		],
	},
	...overrides,
});

describe('/admin/project-approvals/:id issuance prep', () => {
	beforeEach(() => {
		cy.signIn();
	});

	it('prepares issuance for an eligible project and routes directly into SPV review', () => {
		const project = buildProject();
		const preparedSpv = buildSpv();

		cy.interceptApi('/project/101', { method: 'GET' }, { body: project }).as(
			'getProject',
		);
		cy.interceptApi(
			'/project/101/entity-spv-summary',
			{ method: 'GET' },
			{ body: buildSummary() },
		).as('getEntitySpvSummary');
		cy.interceptApi(
			'/project/101/prepare-issuance',
			{ method: 'POST' },
			{ body: preparedSpv },
		).as('prepareIssuance');
		cy.interceptApi('/legal-entity/admin', { method: 'GET' }, { body: [] }).as(
			'getEntities',
		);
		cy.interceptApi(
			'/spv/admin/501',
			{ method: 'GET' },
			{ body: preparedSpv },
		).as('getSpvDetail');

		cy.visit('/admin/project-approvals/101');
		cy.wait(['@getProject', '@getEntitySpvSummary']);

		cy.getBySel('project-issuance-prep-state').should(
			'contain.text',
			'SPV Not Prepared',
		);
		cy.getBySel('project-prepare-issuance').click();

		cy.wait('@prepareIssuance');
		cy.wait(['@getEntities', '@getSpvDetail']);
		cy.url().should('include', '/admin/entities-spvs/spvs/501');
		cy.get('[data-cy=spv-detail-success]').should(
			'contain.text',
			'Draft SPV created and linked party suggestions generated',
		);
	});

	it('reuses the existing draft SPV and prevents duplicate prepare calls on double click', () => {
		const project = buildProject();
		const existingSpv = buildSpv({
			readiness: {
				status: 'blocked',
				requiredRolesComplete: false,
				custodyComplete: true,
				issuanceReady: false,
				blockingIssues: ['Missing required linked party: Trustee'],
			},
		});

		cy.interceptApi('/project/101', { method: 'GET' }, { body: project }).as(
			'getProject',
		);
		cy.interceptApi(
			'/project/101/entity-spv-summary',
			{ method: 'GET' },
			{
				body: buildSummary({
					linkedSpv: existingSpv,
					readiness: existingSpv.readiness,
				}),
			},
		).as('getEntitySpvSummary');
		cy.interceptApi(
			'/project/101/prepare-issuance',
			{ method: 'POST' },
			{
				delay: 300,
				body: existingSpv,
			},
		).as('prepareIssuance');
		cy.interceptApi('/legal-entity/admin', { method: 'GET' }, { body: [] }).as(
			'getEntities',
		);
		cy.interceptApi(
			'/spv/admin/501',
			{ method: 'GET' },
			{ body: existingSpv },
		).as('getSpvDetail');

		cy.visit('/admin/project-approvals/101');
		cy.wait(['@getProject', '@getEntitySpvSummary']);

		cy.getBySel('project-open-spv-review').should('be.enabled');
		cy.getBySel('project-prepare-issuance').dblclick();

		cy.wait('@prepareIssuance');
		cy.get('@prepareIssuance.all').should('have.length', 1);
		cy.wait(['@getEntities', '@getSpvDetail']);
		cy.url().should('include', '/admin/entities-spvs/spvs/501');
		cy.get('[data-cy=spv-detail-success]').should(
			'contain.text',
			'Draft SPV reused and linked party suggestions refreshed',
		);
	});

	it('keeps ineligible projects blocked from issuance prep and explains why', () => {
		const project = buildProject({ status: 'draft' });

		cy.interceptApi('/project/101', { method: 'GET' }, { body: project }).as(
			'getProject',
		);
		cy.interceptApi(
			'/project/101/entity-spv-summary',
			{ method: 'GET' },
			{ body: buildSummary() },
		).as('getEntitySpvSummary');
		cy.interceptApi(
			'/project/101/prepare-issuance',
			{ method: 'POST' },
			{ statusCode: 500, body: {} },
		).as('prepareIssuance');

		cy.visit('/admin/project-approvals/101');
		cy.wait(['@getProject', '@getEntitySpvSummary']);

		cy.getBySel('project-prepare-issuance').should('be.disabled');
		cy.getBySel('project-prepare-issuance-reason').should(
			'contain.text',
			'Approve the project before starting issuance preparation.',
		);
		cy.get('@prepareIssuance.all').should('have.length', 0);
	});

	it('shows issuance blockers from backend readiness on the project view', () => {
		const project = buildProject();
		const blockedSpv = buildSpv({
			readiness: {
				status: 'blocked',
				requiredRolesComplete: false,
				custodyComplete: false,
				issuanceReady: false,
				blockingIssues: [
					'Missing required linked party: Trustee',
					'Required role not approved: Developer',
					'Custody incomplete',
				],
			},
		});

		cy.interceptApi('/project/101', { method: 'GET' }, { body: project }).as(
			'getProject',
		);
		cy.interceptApi(
			'/project/101/entity-spv-summary',
			{ method: 'GET' },
			{
				body: buildSummary({
					linkedSpv: blockedSpv,
					readiness: blockedSpv.readiness,
				}),
			},
		).as('getEntitySpvSummary');

		cy.visit('/admin/project-approvals/101');
		cy.wait(['@getProject', '@getEntitySpvSummary']);

		cy.getBySel('project-issuance-prep-state').should(
			'contain.text',
			'Issuance Blocked',
		);
		cy.getBySel('project-issuance-blockers').should(
			'contain.text',
			'Missing required linked party: Trustee',
		);
		cy.getBySel('project-issuance-blockers').should(
			'contain.text',
			'Required role not approved: Developer',
		);
		cy.getBySel('project-issuance-blockers').should(
			'contain.text',
			'Custody incomplete',
		);
	});
});
