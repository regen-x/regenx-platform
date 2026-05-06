import offers from '../../fixtures/offer/get-offers-response.json';
import ownedOffers from '../../fixtures/offer/get-owned-offers-response.json';

describe('/offers', () => {
	const walletAddress =
		'GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V';
	const simpleSignerUrl = Cypress.env('VITE_SIMPLE_SIGNER_URL');
	const assetCode = 'TEST';
	const assetIssuer = Cypress.env('VITE_ISSUER_ADDRESS');
	const newOwnOffer = {
		type: 'offer',
		id: '2',
		attributes: {
			id: '4',
			user: '38c4f729-1e46-4f7f-a099-6116e2cf62e1',
			price: 50,
			amount: 100,
			projectUuid: 'project-789',
			isActive: true,
			createdAt: '2024-03-20T12:00:00Z',
			updatedAt: '2024-03-20T12:00:00Z',
			project: {
				id: 'a25d6295-48e1-4010-bf2d-e8ee4167f0b9',
				name: 'Testing Project',
				tokenSymbol: 'TEST',
				description: 'This is a test project',
			},
		},
	};

	const editOfferXdrResponse = {
		data: {
			type: 'offer_xdr',
			id: 'edit-offer-1',
			attributes: {
				transactionXdr: 'xdr',
				type: 'update_offer',
			},
		},
		links: {
			self: 'offer/1/price',
		},
	};

	const cancelOfferXdrResponse = {
		data: {
			type: 'offer_xdr',
			id: 'cancel-offer-1',
			attributes: {
				transactionXdr: 'xdr',
				type: 'cancel_offer',
			},
		},
		links: {
			self: 'offer/1/cancel',
		},
	};

	beforeEach(() => {
		cy.signIn('wholesaleInvestor', true);
	});

	it('Should render correctly the offers list', () => {
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

		cy.wait('@getAllOffers');
		cy.wait('@getProject');

		cy.getBySel('offers-list').should('be.visible');
		cy.getBySel('offers-list').children().should('have.length', 2);

		offers.data.map((offer) => {
			cy.getBySel(`offer-card-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-token-name-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-token-symbol-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-token-price-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-token-amount-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-token-created-at-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-buy-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-cancel-${offer.id}`).should('not.exist');
			cy.getBySel(`offer-edit-${offer.id}`).should('not.exist');
		});

		cy.interceptApi(
			'/offer?page[number]=1&filter[userAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{ fixture: 'offer/get-owned-offers-response.json' },
		).as('getOwnOffers');

		cy.getBySel('offers-mine-tab').click();
		cy.wait('@getOwnOffers');
		cy.getBySel('offers-list').children().should('have.length', 1);

		ownedOffers.data.map((offer) => {
			cy.getBySel(`offer-card-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-token-name-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-token-symbol-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-token-price-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-token-amount-${offer.id}`).should('be.visible');
			cy.getBySel(`offer-buy-${offer.id}`).should('not.exist');
			cy.getBySel(`offer-cancel-${offer.id}`).should('exist').and('be.visible');
			cy.getBySel(`offer-edit-${offer.id}`).should('exist').and('be.visible');
		});
	});

	it('Should buy an offer successfully', () => {
		const newOffersData = offers.data.filter((offer) => offer.id !== '1');

		cy.connectWallet(walletAddress, simpleSignerUrl);

		cy.visitOffers();

		cy.intercept(`**/accounts/${walletAddress}`, {
			id: walletAddress,
			account_id: walletAddress,
			sequence: '523470614036490',
			balances: [
				{
					asset_code: offers.data[0].attributes.project.tokenSymbol,
					balance: 0,
					asset_issuer: assetIssuer,
					asset_type: 'credit_alphanum4',
				},
			],
		}).as('getAccountBalance');

		cy.interceptApi(
			'/offer/1/buy',
			{ method: 'POST' },
			{ fixture: 'offer/create-buy-offer-response.json' },
		).as('buyOffer');

		cy.interceptApi(
			'/offer/submit',
			{ method: 'POST' },
			{ body: { status: 'success' } },
		).as('submitOffer');

		cy.interceptApi(
			'/offer?page[number]=1&filter[isActive]=true&filter[excludeAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{ body: { ...offers, data: newOffersData } },
		).as('getNewOffersList');

		cy.getBySel('offers-list').should('be.visible');
		cy.getBySel('offers-list').children().should('have.length', 2);

		cy.window().then((window) => {
			cy.stub(window, 'open')
				.as('connect-wallet')
				.callsFake(() => null);
		});

		cy.getBySel(`offer-buy-${offers.data[0].id}`).click();

		cy.wait(2000);

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

		cy.wait('@getNewOffersList');

		cy.getBySel('toast-container').contains('Offer bought successfully');
	});

	it("Should redirect the user to project if they don't have the token trustline", () => {
		const newOffersData = offers.data.filter((offer) => offer.id !== '1');

		cy.connectWallet(walletAddress, simpleSignerUrl);

		cy.visitOffers();

		cy.intercept(`**/accounts/${walletAddress}`, {
			id: walletAddress,
			account_id: walletAddress,
			sequence: '523470614036490',
			balances: [],
		}).as('getAccountBalance');

		cy.interceptApi(
			'/offer/1/buy',
			{ method: 'POST' },
			{ fixture: 'offer/create-buy-offer-response.json' },
		).as('buyOffer');

		cy.interceptApi(
			'/offer?page[number]=1&filter[isActive]=true&filter[excludeAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{ body: { ...offers, data: newOffersData } },
		).as('getNewOffersList');

		cy.getBySel('offers-list').should('be.visible');
		cy.getBySel('offers-list').children().should('have.length', 2);

		cy.window().then((window) => {
			cy.stub(window, 'open')
				.as('connect-wallet')
				.callsFake(() => null);
		});

		cy.getBySel(`offer-buy-${offers.data[0].id}`).click();

		cy.getBySel('toast-container').contains(
			'Please add the token trustline to your wallet',
		);
		cy.location('pathname').should(
			'include',
			`/project/${offers.data[0].attributes.project.id}`,
		);
	});

	it('Should create a new offer successfully', () => {
		cy.connectWallet(walletAddress, simpleSignerUrl);

		cy.visitOffers();
		cy.window().then((window) => {
			cy.stub(window, 'open')
				.as('connect-wallet')
				.callsFake(() => null);
		});

		cy.getBySel('offers').within(() => {
			cy.contains('button', 'Create Token Offer').click();
		});

		cy.intercept(`**/accounts/${walletAddress}`, {
			id: walletAddress,
			account_id: walletAddress,
			sequence: '523470614036490',
			balances: [
				{
					asset_code: assetCode,
					balance: '10000000000',
					asset_issuer: assetIssuer,
					asset_type: 'credit_alphanum4',
				},
			],
		}).as('getBalance');

		cy.interceptApi(
			'/offer',
			{ method: 'POST' },
			{
				data: {
					type: 'offer_xdr',
					id: 'new-offer-1',
					attributes: {
						transactionXdr: 'XDR',
						type: 'create_offer',
					},
				},
			},
		).as('createOfferXdr');

		cy.getBySel('create-offer-modal').within(() => {
			cy.getBySel('create-offer-amount').type('100');
			cy.getBySel('create-offer-price').type('50');
			cy.getBySel('create-offer-project').select(1);
			cy.getBySel('create-offer-submit').click();
		});

		cy.wait('@getBalance');

		cy.wait('@createOfferXdr');

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

		cy.interceptApi(
			'/offer/submit',
			{ method: 'POST' },
			{
				status: 'success',
			},
		).as('submitOffer');

		cy.getBySel('toast-container').contains('Offer created successfully');

		cy.interceptApi(
			'/offer?page[number]=1&filter[userAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{ body: { ...ownedOffers, data: [...ownedOffers.data, newOwnOffer] } },
		).as('getOwnOffers');

		cy.getBySel('offers-list').children().should('have.length', 2);

		cy.getBySel('offers-mine-tab').click();

		cy.wait('@getOwnOffers');

		cy.getBySel('offers-list').children().should('have.length', 2);

		cy.getBySel(`offer-card-${newOwnOffer.id}`).should('be.visible');
		cy.getBySel(`offer-token-name-${newOwnOffer.id}`).should('be.visible');
		cy.getBySel(`offer-token-symbol-${newOwnOffer.id}`).should('be.visible');
		cy.getBySel(`offer-token-price-${newOwnOffer.id}`).should('be.visible');
		cy.getBySel(`offer-token-amount-${newOwnOffer.id}`).should('be.visible');
		cy.getBySel(`offer-buy-${newOwnOffer.id}`).should('not.exist');
	});

	it('Should edit an offer successfully', () => {
		cy.connectWallet(walletAddress, simpleSignerUrl);

		cy.visitOffers();

		cy.interceptApi(
			'/offer?page[number]=1&filter[userAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{ fixture: 'offer/get-owned-offers-response.json' },
		).as('getOwnOffers');

		cy.interceptApi(
			'/offer/1/price',
			{ method: 'POST' },
			{
				body: editOfferXdrResponse,
			},
		);

		cy.interceptApi(
			'/offer/submit',
			{ method: 'POST' },
			{
				status: 'success',
			},
		).as('submitOffer');

		cy.window().then((window) => {
			cy.stub(window, 'open')
				.as('connect-wallet')
				.callsFake(() => null);
		});

		cy.getBySel('offers-list').should('be.visible');
		cy.getBySel('offers-list').children().should('have.length', 2);

		cy.getBySel('offers-mine-tab').click();
		cy.wait('@getOwnOffers');
		cy.getBySel('offers-list').children().should('have.length', 1);

		cy.getBySel(`offer-edit-${offers.data[0].id}`).click();

		cy.getBySel('edit-offer-price-modal').should('be.visible');
		cy.getBySel('edit-offer-price').type('245');
		cy.getBySel('edit-offer-price-submit').click();

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

		cy.interceptApi(
			'/offer?page[number]=1&filter[userAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{
				body: {
					...ownedOffers,
					data: [
						{
							...ownedOffers.data[0],
							attributes: { ...ownedOffers.data[0].attributes, price: 245 },
						},
					],
				},
			},
		).as('getEditedOwnOffers');

		cy.wait('@submitOffer');
		cy.wait('@getEditedOwnOffers');

		cy.getBySel(`offer-token-price-${offers.data[0].id}`).should(
			'have.text',
			'$245.00',
		);
	});

	it('Should cancel an offer successfully', () => {
		cy.connectWallet(walletAddress, simpleSignerUrl);

		cy.visitOffers();

		cy.interceptApi(
			'/offer?page[number]=1&filter[userAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{ fixture: 'offer/get-owned-offers-response.json' },
		).as('getOwnOffers');

		cy.interceptApi(
			'/offer/1/cancel',
			{ method: 'POST' },
			{
				body: cancelOfferXdrResponse,
			},
		);

		cy.interceptApi(
			'/offer/submit',
			{ method: 'POST' },
			{
				status: 'success',
			},
		).as('submitOffer');

		cy.window().then((window) => {
			cy.stub(window, 'open')
				.as('connect-wallet')
				.callsFake(() => null);
		});

		cy.getBySel('offers-list').should('be.visible');
		cy.getBySel('offers-list').children().should('have.length', 2);

		cy.getBySel('offers-mine-tab').click();
		cy.wait('@getOwnOffers');
		cy.getBySel('offers-list').children().should('have.length', 1);

		cy.getBySel(`offer-cancel-${offers.data[0].id}`).click();

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

		cy.interceptApi(
			'/offer?page[number]=1&filter[userAddress]=GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			{ method: 'GET' },
			{
				body: {
					...ownedOffers,
					data: [
						{
							...ownedOffers.data[0],
							attributes: {
								...ownedOffers.data[0].attributes,
								isActive: false,
							},
						},
					],
				},
			},
		).as('getCanceledOwnOffers');

		cy.wait('@submitOffer');
		cy.wait('@getCanceledOwnOffers');

		cy.getBySel(`offer-token-is-active-${offers.data[0].id}`).should(
			'have.text',
			'Inactive',
		);
	});

	it('Should redirect the user to cash account if tries to make an operation with offers but has no wallet connected ', () => {
		cy.visitOffers();

		cy.getBySel('offers-list').should('be.visible');
		cy.getBySel('offers-list').children().should('have.length', 2);

		cy.getBySel(`offer-buy-${offers.data[0].id}`).click();

		cy.url().should('include', '/cash-account');
		cy.getBySel('toast-container').contains('Please connect your wallet');
	});

	it('Should throw an Insufficient Balance if the user tries to create an offer of a token they do not have enough balance', () => {
		cy.connectWallet(walletAddress, simpleSignerUrl);

		cy.visitOffers();

		cy.getBySel('offers').within(() => {
			cy.contains('button', 'Create Token Offer').click();
		});

		cy.intercept(`**/accounts/${walletAddress}`, {
			id: walletAddress,
			account_id: walletAddress,
			sequence: '523470614036490',
			balances: [
				{
					asset_code: assetCode,
					balance: '1',
					asset_issuer: assetIssuer,
					asset_type: 'credit_alphanum4',
				},
			],
		}).as('getBalance');

		cy.getBySel('create-offer-modal').within(() => {
			cy.getBySel('create-offer-amount').type('10000');
			cy.getBySel('create-offer-price').type('50');
			cy.getBySel('create-offer-project').select(1);
			cy.getBySel('create-offer-submit').click();
		});

		cy.wait('@getBalance');

		cy.getBySel('toast-container').contains('Insufficient token balance');
	});
});
