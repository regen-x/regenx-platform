const walletAddress =
	'GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V';
const simpleSignerUrl = Cypress.env('VITE_SIMPLE_SIGNER_URL');
const issuerAddress = Cypress.env('VITE_ISSUER_ADDRESS');

const liveProjectList = {
	data: [
		{
			type: 'project',
			id: '1',
			attributes: {
				createdAt: '2026-01-10T09:00:00.000Z',
				updatedAt: '2026-04-18T09:00:00.000Z',
				name: 'Solar Orchard Alpha',
				description: 'Utility-scale community solar deployment.',
				location: 'New South Wales',
				fundingGoal: 100000,
				amountSettled: 25000,
				percentFunded: 25,
				investorCount: 3,
				unitsSold: 500,
				unitsRemaining: 1500,
				startDate: '2026-05-01',
				endDate: '2027-05-01',
				climateImpact: 'Offsets 1,500 tCO2e annually',
				tokenSupply: 2000,
				tokenPrice: 50,
				tokenSymbol: 'SOLA',
				tokenAddress: 'CBETAALPHATOKEN1234567890',
				assetCode: 'SOLA',
				assetIssuer: issuerAddress,
				distributorWalletPublic: 'GDISTRIBUTOR1234567890ABCDEFGH',
				status: 'live',
				ownerAddress: 'GOWNER1234567890ABCDEFGH',
				generatesCarbonCredits: true,
				uuid: '1',
			},
		},
	],
	links: {
		self: '/api/v1/project',
	},
};

const liveProjectDetail = {
	data: {
		type: 'project',
		id: '1',
		attributes: liveProjectList.data[0].attributes,
	},
	links: {
		self: '/api/v1/project/public/1',
	},
};

const orderSubmitted = [
	{
		id: 901,
		userId: 77,
		projectId: 1,
		projectName: 'Solar Orchard Alpha',
		tokenSymbol: 'SOLA',
		orderType: 'BUY',
		currencyAmount: 25000,
		tokenAmount: 500,
		status: 'SUBMITTED',
		reference: 'INV-901',
		createdAt: '2026-04-18T09:15:00.000Z',
		updatedAt: '2026-04-18T09:16:00.000Z',
		canCancel: false,
		canRetry: false,
	},
];

const orderCompleted = [
	{
		id: 901,
		userId: 77,
		projectId: 1,
		projectName: 'Solar Orchard Alpha',
		tokenSymbol: 'SOLA',
		orderType: 'BUY',
		currencyAmount: 25000,
		tokenAmount: 500,
		status: 'COMPLETED',
		reference: 'INV-901',
		txHash: 'stellar-buy-hash-901',
		createdAt: '2026-04-18T09:15:00.000Z',
		updatedAt: '2026-04-18T09:30:00.000Z',
		settledAt: '2026-04-18T09:30:00.000Z',
		canCancel: false,
		canRetry: false,
		resultingTransactionId: 3001,
	},
];

const orderDetail = {
	id: 901,
	userId: 77,
	projectId: 1,
	projectName: 'Solar Orchard Alpha',
	tokenSymbol: 'SOLA',
	orderType: 'BUY',
	currencyAmount: 25000,
	tokenAmount: 500,
	status: 'COMPLETED',
	reference: 'INV-901',
	txHash: 'stellar-buy-hash-901',
	createdAt: '2026-04-18T09:15:00.000Z',
	updatedAt: '2026-04-18T09:30:00.000Z',
	settledAt: '2026-04-18T09:30:00.000Z',
	canCancel: false,
	canRetry: false,
	resultingTransaction: {
		id: 3001,
		reference: 'TX-3001',
		amount: 25000,
		tokenAmount: 500,
		status: 'COMPLETED',
		createdAt: '2026-04-18T09:30:00.000Z',
	},
	timeline: [
		{
			status: 'SUBMITTED',
			label: 'Signed purchase submitted',
			timestamp: '2026-04-18T09:16:00.000Z',
			reached: true,
			current: false,
		},
		{
			status: 'SETTLING',
			label: 'Settlement processing',
			timestamp: '2026-04-18T09:20:00.000Z',
			reached: true,
			current: false,
		},
		{
			status: 'COMPLETED',
			label: 'Ownership minted',
			timestamp: '2026-04-18T09:30:00.000Z',
			reached: true,
			current: true,
		},
	],
};

const orderSummarySubmitted = {
	pendingCount: 0,
	settlingCount: 1,
	completedCount: 0,
	failedCount: 0,
};

const orderSummaryCompleted = {
	pendingCount: 0,
	settlingCount: 0,
	completedCount: 1,
	failedCount: 0,
};

const investorTransactions = {
	data: [
		{
			type: 'transaction',
			id: '3001',
			attributes: {
				createdAt: '2026-04-18T09:30:00.000Z',
				amount: 25000,
				currency: 'AUD',
				tokenAmount: 500,
				type: 'BUY',
				status: 'COMPLETED',
				reference: 'TX-3001',
				project: {
					id: '1',
					name: 'Solar Orchard Alpha',
				},
			},
		},
	],
};

const developerTransactions = {
	data: [
		{
			type: 'transaction',
			id: '4001',
			attributes: {
				createdAt: '2026-04-18T09:30:00.000Z',
				amount: 25000,
				currency: 'AUD',
				tokenAmount: 500,
				type: 'BUY',
				status: 'COMPLETED',
				reference: 'DEV-BUY-4001',
				project: {
					id: '1',
					name: 'Solar Orchard Alpha',
				},
			},
		},
	],
};

const distributionSummary = {
	totalIncomeReceived: 3000,
	pendingIncome: 0,
	trailing12MonthIncome: 3000,
	currentYieldEstimate: 12,
	averageYieldAcrossHoldings: 12,
	nextExpectedDistributionDate: '2026-07-01',
	portfolioEstimatedValue: 28000,
	investedCapital: 25000,
	byProject: [
		{
			projectId: 1,
			projectName: 'Solar Orchard Alpha',
			tokenSymbol: 'SOLA',
			totalIncomeReceived: 3000,
			pendingIncome: 0,
			trailing12MonthIncome: 3000,
			latestDistributionDate: '2026-04-01',
			nextExpectedDistributionDate: '2026-07-01',
			estimatedYield: 12,
			investedCapital: 25000,
		},
	],
};

const distributions = [
	{
		id: 801,
		projectId: 1,
		userId: 77,
		type: 'DISTRIBUTION',
		grossAmount: 3200,
		feeAmount: 200,
		netAmount: 3000,
		currency: 'AUD',
		distributionDate: '2026-04-01',
		status: 'PAID',
		reference: 'DIST-801',
		createdAt: '2026-04-01T02:00:00.000Z',
		projectName: 'Solar Orchard Alpha',
		tokenSymbol: 'SOLA',
	},
];

const portfolioHoldings = {
	data: [
		{
			projectId: 1,
			seriesId: 1,
			projectName: 'Solar Orchard Alpha',
			tokenSymbol: 'SOLA',
			assetCode: 'SOLA',
			assetIssuer: issuerAddress,
			projectStatus: 'live',
			custodyType: 'self_custody',
			totalTokens: 500,
			totalValue: 28000,
		},
	],
};

const postSalePortfolioHoldings = {
	data: [
		{
			projectId: 1,
			seriesId: 1,
			projectName: 'Solar Orchard Alpha',
			tokenSymbol: 'SOLA',
			assetCode: 'SOLA',
			assetIssuer: issuerAddress,
			projectStatus: 'live',
			custodyType: 'self_custody',
			totalTokens: 350,
			totalValue: 19600,
		},
	],
};

const developerInvestors = {
	project: {
		id: 1,
		uuid: '1',
		name: 'Solar Orchard Alpha',
		tokenSymbol: 'SOLA',
		tokenSupply: 2000,
	},
	totalInvestors: 3,
	totalCapitalRaised: 25000,
	totalTokensHeld: 500,
	investors: [
		{
			userId: 77,
			investorName: 'Northwind Family Office',
			amountInvested: 25000,
			tokensHeld: 500,
			ownershipPercentage: 25,
			status: 'COMPLETED',
		},
	],
	topHolders: [
		{
			userId: 77,
			investorName: 'Northwind Family Office',
			amountInvested: 25000,
			tokensHeld: 500,
			ownershipPercentage: 25,
			status: 'COMPLETED',
		},
	],
	others: null,
};

const allOffersEmpty = {
	data: [],
};

const myOffersEmpty = {
	data: [],
};

const myOffersLive = {
	data: [
		{
			type: 'offer',
			id: 'offer-11',
			attributes: {
				price: 560000000,
				amount: 1500000000,
				remainingQuantity: 1500000000,
				pricePerToken: 56,
				totalValue: 8400,
				user: walletAddress,
				tokenSymbol: 'SOLA',
				projectName: 'Solar Orchard Alpha',
				status: 'LIVE',
				isActive: true,
				createdAt: '2026-04-18T10:00:00.000Z',
				project: {
					id: '1',
					name: 'Solar Orchard Alpha',
					tokenSymbol: 'SOLA',
					assetCode: 'SOLA',
				},
			},
		},
	],
};

const myOffersFilled = {
	data: [
		{
			type: 'offer',
			id: 'offer-11',
			attributes: {
				price: 560000000,
				amount: 1500000000,
				remainingQuantity: 0,
				pricePerToken: 56,
				totalValue: 8400,
				user: walletAddress,
				tokenSymbol: 'SOLA',
				projectName: 'Solar Orchard Alpha',
				status: 'FILLED',
				isActive: false,
				createdAt: '2026-04-18T10:00:00.000Z',
				project: {
					id: '1',
					name: 'Solar Orchard Alpha',
					tokenSymbol: 'SOLA',
					assetCode: 'SOLA',
				},
			},
		},
	],
};

const secondaryTransactions = {
	data: [
		{
			type: 'transaction',
			id: '5001',
			attributes: {
				createdAt: '2026-04-18T10:05:00.000Z',
				amount: 8400,
				currency: 'AUD',
				tokenAmount: 150,
				type: 'SELL',
				status: 'COMPLETED',
				reference: 'SELL-5001',
				project: {
					id: '1',
					name: 'Solar Orchard Alpha',
				},
			},
		},
	],
};

const signInAndConnect = () => {
	cy.signIn('wholesaleInvestor', true);
	cy.connectWallet(walletAddress, simpleSignerUrl);
};

const stubWalletPopup = () => {
	cy.window().then((window) => {
		cy.stub(window, 'open')
			.as('simple-signer-popup')
			.callsFake(() => null);
	});
};

const stubTrustlineReady = () => {
	cy.intercept(`**/accounts/${walletAddress}`, {
		id: walletAddress,
		account_id: walletAddress,
		sequence: '523470614036490',
		balances: [
			{
				asset_code: 'SOLA',
				balance: '500',
				asset_issuer: issuerAddress,
				asset_type: 'credit_alphanum4',
			},
		],
	}).as('getAccountBalance');
};

const openSignedPurchase = () => {
	cy.visit('/project/1');
	cy.location('pathname').should('eq', '/project/1');
	cy.contains('button', 'Invest through RegenX').should('be.visible').click();
	cy.contains('Investment Review').should('be.visible');
	cy.contains('button', 'Continue with RegenX custody').should('be.visible');
};

const signSimpleSignerTransaction = () => {
	const signEvent = new MessageEvent('message', {
		data: {
			type: 'onSign',
			page: `${simpleSignerUrl}/sign`,
			message: {
				signedXDR: 'signedXdr',
			},
		},
		origin: simpleSignerUrl,
	});

	cy.window().then((win) => {
		win.dispatchEvent(signEvent);
	});
};

describe('critical platform flows', () => {
	beforeEach(() => {
		cy.interceptApi(
			'/project/public/1',
			{ method: 'GET' },
			{ body: liveProjectDetail },
		).as('getPublicProject');
	});

	it('validates the investor happy path across verification, investment, orders, transactions, portfolio, and distributions', () => {
		cy.interceptApi(
			'/project',
			{ method: 'GET' },
			{ body: liveProjectList },
		).as('getProjects');
		cy.interceptApi(
			'/investor-verification/me',
			{ method: 'GET' },
			{ body: {} },
		).as('getVerificationRecord');
		cy.interceptApi(
			'/investor-verification/**/can-invest',
			{ method: 'GET' },
			{ body: { canInvest: false } },
		).as('getCanInvest');

		cy.visit('/auth/sign-up');
		cy.location('pathname').should('eq', '/auth/sign-up');
		cy.getInputAndType('sign-up-name', 'Northwind Family Office');
		cy.getInputAndType('sign-up-username', 'northwind@example.com');
		cy.getInputAndType('sign-up-password', 'Supersecret2024~');
		cy.getInputAndType('sign-up-phone', '+61444444444');
		cy.getInputAndType('sign-up-dob', '1990-01-01');
		cy.getInputAndType('sign-up-confirm-password', 'Supersecret2024~');
		cy.getBySel('sign-up-type').select(1);
		cy.interceptApi(
			'/auth/sign-up',
			{ method: 'POST' },
			{ fixture: 'auth/sign-up.json' },
		).as('sign-up');
		cy.getBySel('sign-up-submit').click();
		cy.wait('@sign-up');
		cy.getBySel('toast-container').contains('User signed up correctly');

		signInAndConnect();

		cy.visit('/account-verification');
		cy.wait(['@getVerificationRecord', '@getCanInvest']);
		cy.location('pathname').should('eq', '/account-verification');
		cy.contains('Verify Identity with Sumsub').should('be.visible');

		cy.visit('/opportunities');
		cy.wait('@getProjects');
		cy.location('pathname').should('eq', '/opportunities');
		cy.getBySel('opportunities').should('be.visible');
		cy.getBySel('project-item-view-1')
			.should('be.visible')
			.and('contain.text', 'View');

		cy.interceptApi(
			'/ownership/buy',
			{ method: 'POST' },
			{ statusCode: 200, body: { success: true } },
		).as('submitPurchase');

		openSignedPurchase();
		cy.contains('button', 'Continue with RegenX custody').click();
		cy.wait('@submitPurchase');
		cy.getBySel('toast-container').contains(
			'Investment order submitted successfully through RegenX managed custody.',
		);

		cy.interceptApi(
			'/orders/me',
			{ method: 'GET' },
			{ body: orderSubmitted },
		).as('getOrdersSubmitted');
		cy.interceptApi(
			'/orders/me/summary',
			{ method: 'GET' },
			{ body: orderSummarySubmitted },
		).as('getOrderSummarySubmitted');
		cy.visit('/orders');
		cy.wait(['@getOrdersSubmitted', '@getOrderSummarySubmitted']);
		cy.location('pathname').should('eq', '/orders');
		cy.contains('Order Activity').should('be.visible');
		cy.contains('Solar Orchard Alpha').should('be.visible');
		cy.contains('SUBMITTED').should('be.visible');

		cy.interceptApi(
			'/orders/me',
			{ method: 'GET' },
			{ body: orderCompleted },
		).as('getOrdersCompleted');
		cy.interceptApi(
			'/orders/me/summary',
			{ method: 'GET' },
			{ body: orderSummaryCompleted },
		).as('getOrderSummaryCompleted');
		cy.interceptApi('/orders/901', { method: 'GET' }, { body: orderDetail }).as(
			'getOrderDetail',
		);
		cy.visit('/orders');
		cy.wait(['@getOrdersCompleted', '@getOrderSummaryCompleted']);
		cy.contains('COMPLETED').should('be.visible');
		cy.contains('button', 'View details').click();
		cy.wait('@getOrderDetail');
		cy.contains('Order Detail').should('be.visible');
		cy.contains('Ownership minted').should('be.visible');
		cy.interceptApi(
			'/transactions/me**',
			{ method: 'GET' },
			{ body: investorTransactions },
		).as('getInvestorTransactions');
		cy.contains('button', 'View Resulting Transaction').click();
		cy.wait('@getInvestorTransactions');
		cy.location('pathname').should('eq', '/transactions');
		cy.location('search').should('contain', 'reference=TX-3001');
		cy.contains('Filtered to reference:').should('be.visible');
		cy.contains('TX-3001').should('be.visible');
		cy.contains('Buy').should('be.visible');

		cy.interceptApi(
			'/ownership/me',
			{ method: 'GET' },
			{ body: portfolioHoldings },
		).as('getPortfolioHoldings');
		cy.interceptApi(
			'/distributions/summary/me',
			{ method: 'GET' },
			{ body: distributionSummary },
		).as('getDistributionSummary');
		cy.visit('/portfolio');
		cy.wait(['@getPortfolioHoldings', '@getDistributionSummary']);
		cy.location('pathname').should('eq', '/portfolio');
		cy.contains('My Holdings').should('be.visible');
		cy.contains('Solar Orchard Alpha').should('be.visible');
		cy.contains('500').should('be.visible');
		cy.contains('Platform Managed').should('be.visible');

		cy.interceptApi(
			'/distributions/me',
			{ method: 'GET' },
			{ body: distributions },
		).as('getDistributions');
		cy.interceptApi(
			'/distributions/summary/me',
			{ method: 'GET' },
			{ body: distributionSummary },
		).as('getDistributionsSummaryPage');
		cy.visit('/distributions');
		cy.wait(['@getDistributions', '@getDistributionsSummaryPage']);
		cy.location('pathname').should('eq', '/distributions');
		cy.contains('Income Ledger').should('be.visible');
		cy.contains('DIST-801').should('be.visible');
		cy.contains('PAID').should('be.visible');
	});

	it('validates the investor order failure path and surfaces actionable error feedback', () => {
		// TODO(regenx-e2e): The buy modal currently closes after onSubmit resolves even when the submit step only emitted an error toast.
		// Keep this test on the current toast UX, then tighten it to require a persistent inline retry banner when the flow is fixed.
		signInAndConnect();
		stubTrustlineReady();

		cy.interceptApi(
			'/ownership/buy',
			{ method: 'POST' },
			{
				statusCode: 500,
				body: {
					error: {
						detail: 'Settlement rail unavailable',
					},
				},
			},
		).as('submitFailedPurchase');

		openSignedPurchase();
		cy.contains('button', 'Continue with RegenX custody').click();
		cy.wait('@submitFailedPurchase');
		cy.location('pathname').should('eq', '/project/1');
		cy.getBySel('toast-container').contains('Settlement rail unavailable');
	});

	it('validates sell order creation, my offers visibility, simulated fill, and downstream ownership records', () => {
		signInAndConnect();
		cy.interceptApi(
			'/project',
			{ method: 'GET' },
			{ body: liveProjectList },
		).as('getProjects');

		cy.intercept(`**/accounts/${walletAddress}`, {
			id: walletAddress,
			account_id: walletAddress,
			sequence: '523470614036490',
			balances: [
				{
					asset_code: 'SOLA',
					balance: '500',
					asset_issuer: issuerAddress,
					asset_type: 'credit_alphanum4',
				},
			],
		}).as('getOfferBalance');

		cy.interceptApi(
			'/offer?page[number]=1&filter[isActive]=true&filter[excludeAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{ body: allOffersEmpty },
		).as('getAllOffersEmpty');
		cy.interceptApi(
			'/offer?page[number]=1&filter[userAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{ body: myOffersEmpty },
		).as('getMyOffersEmpty');
		cy.interceptApi(
			'/offer',
			{ method: 'POST' },
			{
				body: {
					data: {
						attributes: {
							transactionXdr: 'createOfferXdr',
						},
					},
				},
			},
		).as('createOfferXdr');
		cy.interceptApi(
			'/offer/submit',
			{ method: 'POST' },
			{ body: { data: {} } },
		).as('submitOffer');
		cy.interceptApi(
			'/offer?page[number]=1&filter[isActive]=true&filter[excludeAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{ body: allOffersEmpty },
		).as('getAllOffersAfterCreate');
		cy.interceptApi(
			'/offer?page[number]=1&filter[userAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{ body: myOffersLive },
		).as('getMyOffersLive');

		cy.visit('/offers');
		cy.wait(['@getProjects', '@getAllOffersEmpty', '@getMyOffersEmpty']);
		cy.location('pathname').should('eq', '/offers');
		cy.contains('Create Sell Order').should('be.visible').click();
		cy.getBySel('create-offer-modal').should('be.visible');
		cy.getBySel('create-offer-project').select('1');
		cy.wait('@getOfferBalance');
		cy.getBySel('create-offer-amount').type('150');
		cy.getBySel('create-offer-price').type('56');
		stubWalletPopup();
		cy.getBySel('create-offer-submit').click();
		signSimpleSignerTransaction();
		cy.wait('@createOfferXdr');
		cy.wait('@submitOffer');
		cy.wait(['@getAllOffersAfterCreate', '@getMyOffersLive']);
		cy.getBySel('toast-container').contains('Sell order created successfully');

		cy.contains('button', 'My Offers').click();
		cy.contains('Solar Orchard Alpha').should('be.visible');
		cy.contains('LIVE').should('be.visible');
		cy.contains('$56.00').should('be.visible');

		cy.interceptApi(
			'/offer?page[number]=1&filter[userAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{ body: myOffersFilled },
		).as('getMyOffersFilled');
		cy.reload();
		cy.wait('@getMyOffersFilled');
		cy.contains('button', 'My Offers').click();
		cy.contains('FILLED').should('be.visible');

		cy.interceptApi(
			'/transactions/me**',
			{ method: 'GET' },
			{ body: secondaryTransactions },
		).as('getSecondaryTransactions');
		cy.visit('/transactions');
		cy.wait('@getSecondaryTransactions');
		cy.location('pathname').should('eq', '/transactions');
		cy.contains('SELL-5001').should('be.visible');
		cy.contains('Sell').should('be.visible');

		cy.interceptApi(
			'/ownership/me',
			{ method: 'GET' },
			{ body: postSalePortfolioHoldings },
		).as('getPostSaleHoldings');
		cy.interceptApi(
			'/distributions/summary/me',
			{ method: 'GET' },
			{ body: distributionSummary },
		).as('getPostSaleDistributionSummary');
		cy.visit('/portfolio');
		cy.wait(['@getPostSaleHoldings', '@getPostSaleDistributionSummary']);
		cy.contains('Solar Orchard Alpha').should('be.visible');
		cy.contains('350').should('be.visible');
	});

	it('validates developer visibility across dashboard, project, investors, and transaction history', () => {
		cy.signIn('climateDeveloper', true);
		cy.interceptApi(
			'/project/my',
			{ method: 'GET' },
			{ body: liveProjectList },
		).as('getMyProjects');
		cy.interceptApi(
			'/project/1/investors',
			{ method: 'GET' },
			{ body: developerInvestors },
		).as('getProjectInvestors');
		cy.interceptApi(
			'/transactions/developer/me**',
			{ method: 'GET' },
			{ body: developerTransactions },
		).as('getDeveloperTransactions');

		cy.visit('/dashboard');
		cy.wait('@getMyProjects');
		cy.location('pathname').should('eq', '/dashboard');
		cy.getBySel('dashboard').should('be.visible');
		cy.contains('Solar Orchard Alpha').should('be.visible');
		cy.contains('$100,000').should('be.visible');

		cy.visit('/project/1');
		cy.wait('@getPublicProject');
		cy.location('pathname').should('eq', '/project/1');
		cy.contains('$25,000 / $100,000 settled').should('be.visible');

		cy.visit('/investors');
		cy.wait(['@getMyProjects', '@getProjectInvestors']);
		cy.location('pathname').should('eq', '/investors');
		cy.contains('Project investor management').should('be.visible');
		cy.contains('Capital raised').should('be.visible');
		cy.contains('$25,000.00').should('be.visible');
		cy.contains('Northwind Family Office').should('be.visible');

		cy.visit('/developer-transactions');
		cy.wait(['@getMyProjects', '@getDeveloperTransactions']);
		cy.location('pathname').should('eq', '/developer-transactions');
		cy.contains('Capital inflows').should('be.visible');
		cy.contains('$25,000.00').should('be.visible');
		cy.contains('DEV-BUY-4001').should('be.visible');
	});
});
