import project from '../../fixtures/project/get-project-response.json';

describe('/project/:projectId', () => {
	const projectId = 'a25d6295-48e1-4010-bf2d-e8ee4167f0b9';
	const walletAddress =
		'GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V';
	const simpleSignerUrl = Cypress.env('VITE_SIMPLE_SIGNER_URL');
	const assetCode = 'TEST';
	const assetIssuer = Cypress.env('VITE_ISSUER_ADDRESS');

	beforeEach(() => {
		cy.signIn('wholesaleInvestor', true);
	});

	it('Should render correctly', () => {
		cy.interceptApi(
			`/project/${projectId}`,
			{ method: 'GET' },
			{ fixture: 'project/get-project-response.json' },
		).as('getProject');

		const {
			data: {
				attributes: {
					name,
					description,
					location,
					fundingGoal,
					startDate,
					endDate,
					climateImpact,
					generatesCarbonCredits,
					tokenSupply,
					tokenPrice,
					tokenSymbol,
					ownerAddress,
				},
			},
		} = project;

		cy.visit(`/project/${projectId}`);

		cy.wait('@getProject');

		cy.getBySel('header-title').should('be.visible').and('have.text', name);

		cy.getBySel('project-details-card')
			.should('be.visible')
			.and('have.text', 'Project details');

		cy.getBySel('token-details-card')
			.should('be.visible')
			.and('have.text', 'Token details');

		cy.getBySel('project-description')
			.should('be.visible')
			.and('have.text', description);

		cy.getBySel('project-location')
			.should('be.visible')
			.and('have.text', location);

		cy.getBySel('project-funding-goal')
			.should('be.visible')
			.and('include.text', fundingGoal);

		cy.getBySel('project-dates')
			.should('be.visible')
			.and(
				'include.text',
				`${new Date(startDate).toLocaleDateString()} - ${new Date(
					endDate,
				).toLocaleDateString()}`,
			);

		cy.getBySel('project-climate-impact')
			.should('be.visible')
			.and('have.text', climateImpact);

		cy.getBySel('project-generates-carbon-credits')
			.should('be.visible')
			.and('have.text', generatesCarbonCredits ? 'Yes' : 'No');

		cy.getBySel('token-supply')
			.should('be.visible')
			.and('include.text', tokenSupply / 10 ** 7);

		cy.getBySel('token-initial-price')
			.should('be.visible')
			.and('include.text', tokenPrice / 10 ** 7);

		cy.getBySel('token-symbol')
			.should('be.visible')
			.and('include.text', tokenSymbol);

		cy.getBySel('token-owner-address')
			.should('be.visible')
			.and(
				'include.text',
				`${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`,
			);
	});

	it('Should render a message if fetching fails of project is not found', () => {
		cy.interceptApi(
			`/project/${projectId}`,
			{ method: 'GET' },
			{ statusCode: 404 },
		).as('getProjectError');

		cy.visit(`/project/${projectId}`);

		cy.wait('@getProjectError');

		cy.getBySel('project-not-found')
			.should('be.visible')
			.and('include.text', "We couldn't retrieve this project");

		cy.getBySel('toast-container').contains(
			'An error occurred while fetching project',
		);
	});

	describe('Trustline and token purchase', () => {
		beforeEach(() => {
			cy.interceptApi(
				`/project/${projectId}`,
				{ method: 'GET' },
				{ fixture: 'project/get-project-response.json' },
			).as('getProject');
		});

		it('Should handle trustline check and addition successfully', () => {
			cy.connectWallet(walletAddress, simpleSignerUrl);
			cy.visit(`/project/${projectId}`);
			cy.wait('@getProject');

			cy.window().then((window) => {
				cy.stub(window, 'open')
					.as('connect-wallet')
					.callsFake(() => null);
			});

			cy.intercept(`**/accounts/${walletAddress}`, {
				id: walletAddress,
				account_id: walletAddress,
				sequence: '523470614036490',
				balances: [],
			}).as('getAccountBalance');

			cy.intercept(`**/transactions`, {
				statusCode: 200,
			}).as('submitTransaction');

			cy.getBySel('check-trustline-button').click();

			cy.wait('@getAccountBalance');

			cy.wait(2000);

			const signEvent = new MessageEvent('message', {
				data: {
					type: 'onSign',
					page: `${simpleSignerUrl}/sign`,
					message: {
						signedXDR:
							'AAAAAgAAAAAt76PxQD7DRtry69iNBvU5X+1ynfNG57g8UGiim3cZPgAAAGQAEgnvAAAAEwAAAAEAAAAAAAAAAAAAAABnssL0AAAAAAAAAAEAAAAAAAAABgAAAAFVU0RDAAAAAMi+1K5wc8TTSWi1WHAW6+RiMqbX8Hr+JAVaee1yr9mXf/////////8AAAAAAAAAAA==',
					},
				},
				origin: simpleSignerUrl,
			});

			cy.window().then((win) => {
				win.dispatchEvent(signEvent);
			});

			cy.wait('@submitTransaction');

			cy.getBySel('toast-container').contains('Trustline added successfully');
			cy.getBySel('buy-tokens-button').should('be.visible');
		});

		it('Should display a success message when trustline is already added', () => {
			cy.connectWallet(walletAddress, simpleSignerUrl);
			cy.visit(`/project/${projectId}`);
			cy.wait('@getProject');

			cy.window().then((window) => {
				cy.stub(window, 'open')
					.as('connect-wallet')
					.callsFake(() => null);
			});

			cy.intercept(`**/accounts/${walletAddress}`, {
				id: walletAddress,
				account_id: walletAddress,
				sequence: '523470614036490',
				balances: [
					{
						asset_code: assetCode,
						balance: 0,
						asset_issuer: assetIssuer,
						asset_type: 'credit_alphanum4',
					},
				],
			}).as('getAccountBalance');

			cy.intercept(`**/transactions`, {
				statusCode: 200,
			}).as('submitTransaction');

			cy.getBySel('check-trustline-button').click();

			cy.wait('@getAccountBalance');

			cy.getBySel('toast-container').contains('Trustline already added');
			cy.getBySel('buy-tokens-button').should('be.visible');
		});

		it('Should redirect the user to cash account if wallet is not connected', () => {
			cy.visit(`/project/${projectId}`);
			cy.wait('@getProject');

			cy.getBySel('check-trustline-button').click();

			cy.location('pathname').should('eq', '/cash-account');
			cy.getBySel('toast-container').contains(
				'Please connect your wallet to check the trustline',
			);
		});

		it('Should show error when trustline check fails', () => {
			cy.connectWallet(walletAddress, simpleSignerUrl);
			cy.visit(`/project/${projectId}`);
			cy.wait('@getProject');

			cy.window().then((window) => {
				cy.stub(window, 'open')
					.as('connect-wallet')
					.callsFake(() => null);
			});

			cy.intercept(`**/accounts/${walletAddress}`, {
				id: walletAddress,
				account_id: walletAddress,
				sequence: '523470614036490',
				balances: [],
			}).as('getAccountBalance');

			cy.intercept(`**/transactions`, {
				statusCode: 400,
			}).as('submitTransaction');

			cy.getBySel('check-trustline-button').click();

			cy.wait('@getAccountBalance');

			cy.wait(2000);

			const signEvent = new MessageEvent('message', {
				data: {
					type: 'onSign',
					page: `${simpleSignerUrl}/sign`,
					message: {
						signedXDR:
							'AAAAAgAAAAAt76PxQD7DRtry69iNBvU5X+1ynfNG57g8UGiim3cZPgAAAGQAEgnvAAAAEwAAAAEAAAAAAAAAAAAAAABnssL0AAAAAAAAAAEAAAAAAAAABgAAAAFVU0RDAAAAAMi+1K5wc8TTSWi1WHAW6+RiMqbX8Hr+JAVaee1yr9mXf/////////8AAAAAAAAAAA==',
					},
				},
				origin: simpleSignerUrl,
			});

			cy.window().then((win) => {
				win.dispatchEvent(signEvent);
			});

			cy.wait('@submitTransaction');

			cy.getBySel('toast-container').contains(
				'An error occurred while checking trustline',
			);
		});

		it('Should handle token purchase successfully', () => {
			cy.connectWallet(walletAddress, simpleSignerUrl);
			cy.visit(`/project/${projectId}`);
			cy.wait('@getProject');

			cy.window().then((window) => {
				cy.stub(window, 'open')
					.as('connect-wallet')
					.callsFake(() => null);
			});

			cy.intercept(`**/accounts/${walletAddress}`, {
				id: walletAddress,
				account_id: walletAddress,
				sequence: '523470614036490',
				balances: [
					{
						asset_code: assetCode,
						balance: 0,
						asset_issuer: assetIssuer,
						asset_type: 'credit_alphanum4',
					},
				],
			}).as('getAccountBalance');

			cy.intercept(`**/transactions`, {
				statusCode: 200,
			}).as('submitTransaction');

			cy.interceptApi(
				`/contract/transfer/transaction`,
				{ method: 'POST' },
				{ data: { attributes: { transactionXdr: 'transactionXdr' } } },
			).as('createTransferXdr');

			cy.interceptApi(
				`/contract/transfer`,
				{ method: 'POST' },
				{ statusCode: 200 },
			).as('submitTransfer');

			cy.getBySel('check-trustline-button').click();

			cy.wait('@getAccountBalance');

			cy.getBySel('toast-container').contains('Trustline already added');
			cy.getBySel('buy-tokens-button').should('be.visible').click();

			cy.getBySel('buy-tokens-modal').should('be.visible');
			cy.get('input[name="amount"]').type('100');
			cy.getBySel('buy-tokens-submit').click();

			cy.wait('@createTransferXdr');

			const signEvent = new MessageEvent('message', {
				data: {
					type: 'onSign',
					page: `${simpleSignerUrl}/sign`,
					message: {
						signedXDR:
							'AAAAAgAAAAAt76PxQD7DRtry69iNBvU5X+1ynfNG57g8UGiim3cZPgAAAGQAEgnvAAAAEwAAAAEAAAAAAAAAAAAAAABnssL0AAAAAAAAAAEAAAAAAAAABgAAAAFVU0RDAAAAAMi+1K5wc8TTSWi1WHAW6+RiMqbX8Hr+JAVaee1yr9mXf/////////8AAAAAAAAAAA==',
					},
				},
				origin: simpleSignerUrl,
			});

			cy.window().then((win) => {
				win.dispatchEvent(signEvent);
			});

			cy.wait('@submitTransfer');

			cy.getBySel('toast-container').contains('Tokens bought successfully');
		});

		it('Should show error when token purchase fails', () => {
			cy.connectWallet(walletAddress, simpleSignerUrl);
			cy.visit(`/project/${projectId}`);
			cy.wait('@getProject');

			cy.window().then((window) => {
				cy.stub(window, 'open')
					.as('connect-wallet')
					.callsFake(() => null);
			});

			cy.intercept(`**/accounts/${walletAddress}`, {
				id: walletAddress,
				account_id: walletAddress,
				sequence: '523470614036490',
				balances: [
					{
						asset_code: assetCode,
						balance: 0,
						asset_issuer: assetIssuer,
						asset_type: 'credit_alphanum4',
					},
				],
			}).as('getAccountBalance');

			cy.intercept(`**/transactions`, {
				statusCode: 200,
			}).as('submitTransaction');

			cy.interceptApi(
				`/contract/transfer/transaction`,
				{ method: 'POST' },
				{ data: { attributes: { transactionXdr: 'transactionXdr' } } },
			).as('createTransferXdr');

			cy.interceptApi(
				`/contract/transfer`,
				{ method: 'POST' },
				{ statusCode: 400 },
			).as('submitTransfer');

			cy.getBySel('check-trustline-button').click();

			cy.wait('@getAccountBalance');

			cy.getBySel('toast-container').contains('Trustline already added');
			cy.getBySel('buy-tokens-button').should('be.visible').click();

			cy.getBySel('buy-tokens-modal').should('be.visible');
			cy.get('input[name="amount"]').type('100');
			cy.getBySel('buy-tokens-submit').click();

			cy.wait('@createTransferXdr');

			const signEvent = new MessageEvent('message', {
				data: {
					type: 'onSign',
					page: `${simpleSignerUrl}/sign`,
					message: {
						signedXDR:
							'AAAAAgAAAAAt76PxQD7DRtry69iNBvU5X+1ynfNG57g8UGiim3cZPgAAAGQAEgnvAAAAEwAAAAEAAAAAAAAAAAAAAABnssL0AAAAAAAAAAEAAAAAAAAABgAAAAFVU0RDAAAAAMi+1K5wc8TTSWi1WHAW6+RiMqbX8Hr+JAVaee1yr9mXf/////////8AAAAAAAAAAA==',
					},
				},
				origin: simpleSignerUrl,
			});

			cy.window().then((win) => {
				win.dispatchEvent(signEvent);
			});

			cy.wait('@submitTransfer');

			cy.getBySel('toast-container').contains(
				'An error occurred while buying tokens',
			);
		});
	});
});
