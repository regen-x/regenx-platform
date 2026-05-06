const buildSpvDetail = (overrides = {}) => ({
	id: 12,
	name: 'Little Growling Cafe Battery SPV',
	legalEntityName: 'Little Growling Cafe Battery SPV',
	jurisdiction: 'Australia',
	structureType: 'MIS',
	status: 'draft',
	notes: null,
	sponsorEntityId: 2,
	sponsorEntityName: 'Eliot Energy',
	custodyModel: 'regenx_custody',
	projectId: 44,
	linkedProjectName: 'Little Growling Cafe Battery',
	createdAt: '2026-04-23T00:00:00.000Z',
	updatedAt: '2026-04-23T00:00:00.000Z',
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
	roleCoverage: {
		approved: 1,
		suggested: 2,
		missing: 1,
	},
	linkedParties: [
		{
			key: 'developer',
			label: 'Developer',
			role: 'developer',
			acceptedRoles: ['developer'],
			isRequired: true,
			entityId: 2,
			entityName: 'Eliot Energy',
			entityStatus: 'active',
			roleLinkId: 101,
			status: 'suggested',
			source: 'auto',
			confidenceScore: 0.94,
			notes: 'Suggested from project owner.',
			approvedAt: null,
		},
		{
			key: 'trustee',
			label: 'Trustee',
			role: 'trustee',
			acceptedRoles: ['trustee', 'responsible_entity'],
			isRequired: true,
			entityId: null,
			entityName: null,
			entityStatus: null,
			roleLinkId: null,
			status: 'missing',
			source: null,
			confidenceScore: null,
			notes: null,
			approvedAt: null,
		},
	],
	...overrides,
});

const entities = [
	{
		id: 2,
		entityName: 'Eliot Energy',
		tradingName: null,
		entityType: 'Company',
		abn: null,
		acn: null,
		jurisdiction: 'Australia',
		status: 'active',
		contactEmail: null,
		notes: null,
		operationalRole: 'developer',
		custodyModel: 'regenx_custody',
		createdAt: '2026-04-23T00:00:00.000Z',
		updatedAt: '2026-04-23T00:00:00.000Z',
	},
	{
		id: 3,
		entityName: 'Harbour Trustee Co',
		tradingName: null,
		entityType: 'Trust',
		abn: null,
		acn: null,
		jurisdiction: 'Australia',
		status: 'active',
		contactEmail: null,
		notes: null,
		operationalRole: 'trustee',
		custodyModel: 'regenx_custody',
		createdAt: '2026-04-23T00:00:00.000Z',
		updatedAt: '2026-04-23T00:00:00.000Z',
	},
];

describe('/admin/entities-spvs', () => {
	it('renders SPV readiness and linked-party coverage on the registry page', () => {
		cy.signIn();

		cy.interceptApi(
			'/spv/admin',
			{ method: 'GET' },
			{ body: [buildSpvDetail()] },
		).as('getSpvs');
		cy.interceptApi(
			'/legal-entity/admin',
			{ method: 'GET' },
			{ body: entities },
		).as('getEntities');

		cy.visit('/admin/entities-spvs');
		cy.wait(['@getSpvs', '@getEntities']);

		cy.getBySel('admin-entities-spvs-page').should('be.visible');
		cy.getBySel('spv-row-12').should(
			'contain.text',
			'Little Growling Cafe Battery SPV',
		);
		cy.getBySel('spv-row-12').should('contain.text', 'Blocked');
		cy.getBySel('spv-row-12').should('contain.text', '1 missing');
	});

	it('approves, rejects, and replaces linked parties from SPV detail', () => {
		cy.signIn();

		cy.interceptApi(
			'/legal-entity/admin',
			{ method: 'GET' },
			{ body: entities },
		).as('getEntities');
		cy.interceptApi(
			'/spv/admin/12',
			{ method: 'GET' },
			{ body: buildSpvDetail() },
		).as('getSpv');
		cy.interceptApi(
			'/spv/admin/12/linked-parties',
			{ method: 'POST' },
			(req) => {
				if (req.body.role === 'developer') {
					req.reply({
						body: buildSpvDetail({
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
							linkedParties: [
								{
									...buildSpvDetail().linkedParties[0],
									status: 'approved',
								},
								buildSpvDetail().linkedParties[1],
							],
						}),
					});
					return;
				}

				req.reply({
					body: buildSpvDetail({
						linkedParties: [
							{
								...buildSpvDetail().linkedParties[0],
								status: 'approved',
								entityId: 3,
								entityName: 'Harbour Trustee Co',
							},
							buildSpvDetail().linkedParties[1],
						],
					}),
				});
			},
		).as('upsertRole');
		cy.interceptApi(
			'/spv/admin/12/linked-parties/101/reject',
			{ method: 'POST' },
			{
				body: buildSpvDetail({
					linkedParties: [
						{
							...buildSpvDetail().linkedParties[0],
							status: 'rejected',
							roleLinkId: 101,
						},
						buildSpvDetail().linkedParties[1],
					],
				}),
			},
		).as('rejectRole');

		cy.visit('/admin/entities-spvs/spvs/12');
		cy.wait(['@getEntities', '@getSpv']);

		cy.getBySel('linked-party-row-developer').should(
			'contain.text',
			'Suggested',
		);
		cy.getBySel('approve-party-developer').click();
		cy.wait('@upsertRole');
		cy.getBySel('linked-party-row-developer').should(
			'contain.text',
			'Approved',
		);

		cy.getBySel('linked-party-select-developer').select('Harbour Trustee Co');
		cy.getBySel('replace-party-developer').click();
		cy.wait('@upsertRole');
		cy.getBySel('linked-party-row-developer').should(
			'contain.text',
			'Harbour Trustee Co',
		);

		cy.getBySel('reject-party-developer').click();
		cy.wait('@rejectRole');
		cy.getBySel('linked-party-row-developer').should(
			'contain.text',
			'Rejected',
		);
	});

	it('creates and links a missing entity inline and refreshes readiness', () => {
		cy.signIn();

		cy.interceptApi(
			'/legal-entity/admin',
			{ method: 'GET' },
			{ body: entities },
		).as('getEntities');
		cy.interceptApi(
			'/spv/admin/12',
			{ method: 'GET' },
			{ body: buildSpvDetail() },
		).as('getSpv');
		cy.interceptApi(
			'/legal-entity/admin',
			{ method: 'POST' },
			{
				body: {
					...entities[1],
					id: 9,
					entityName: 'New Trustee Nominees',
				},
			},
		).as('createEntity');
		cy.interceptApi(
			'/spv/admin/12/linked-parties',
			{ method: 'POST' },
			{
				body: buildSpvDetail({
					readiness: {
						status: 'ready',
						requiredRolesComplete: true,
						custodyComplete: true,
						issuanceReady: true,
						blockingIssues: [],
					},
					roleCoverage: {
						approved: 2,
						suggested: 0,
						missing: 0,
					},
					linkedParties: [
						{
							...buildSpvDetail().linkedParties[0],
							status: 'approved',
						},
						{
							...buildSpvDetail().linkedParties[1],
							entityId: 9,
							entityName: 'New Trustee Nominees',
							entityStatus: 'draft',
							roleLinkId: 202,
							status: 'approved',
							source: 'manual',
						},
					],
				}),
			},
		).as('linkEntity');

		cy.visit('/admin/entities-spvs/spvs/12');
		cy.wait(['@getEntities', '@getSpv']);

		cy.getBySel('create-link-party-trustee').click();
		cy.getBySel('create-link-entity-modal').should('be.visible');
		cy.getBySel('save-create-link-entity').should('be.visible');
		cy.getBySel('create-link-entity-entityName')
			.clear()
			.type('New Trustee Nominees');
		cy.getBySel('save-create-link-entity').click();
		cy.wait(['@createEntity', '@linkEntity']);
		cy.getBySel('linked-party-row-trustee').should(
			'contain.text',
			'New Trustee Nominees',
		);
		cy.getBySel('spv-readiness-panel').should('contain.text', 'Yes');
	});

	it('shows backend errors cleanly when a linked-party action fails', () => {
		cy.signIn();

		cy.interceptApi(
			'/legal-entity/admin',
			{ method: 'GET' },
			{ body: entities },
		).as('getEntities');
		cy.interceptApi(
			'/spv/admin/12',
			{ method: 'GET' },
			{ body: buildSpvDetail() },
		).as('getSpv');
		cy.interceptApi(
			'/spv/admin/12/linked-parties',
			{ method: 'POST' },
			{
				statusCode: 400,
				body: { message: 'Required role not approved yet.' },
			},
		).as('upsertRoleError');

		cy.visit('/admin/entities-spvs/spvs/12');
		cy.wait(['@getEntities', '@getSpv']);

		cy.getBySel('approve-party-developer').click();
		cy.wait('@upsertRoleError');
		cy.getBySel('spv-detail-error').should(
			'contain.text',
			'Required role not approved yet.',
		);
	});
});
