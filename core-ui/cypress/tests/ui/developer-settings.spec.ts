describe('Developer settings', () => {
	const settingsSummary = {
		companyDetails: {
			legalEntityName: 'RegenX Climate Holdings Pty Ltd',
			tradingName: 'RegenX Climate',
			abn: '12345678901',
			acn: '600123456',
			contactName: 'Taylor Green',
			contactEmail: 'taylor@example.com',
			phone: '+61400000000',
			website: 'https://regenx.example.com',
			registeredAddress: '1 Market Street, Sydney NSW',
			businessDescription: 'Distributed clean energy project origination.',
			verificationStatus: 'approved',
			submittedAt: '2026-04-20T00:00:00.000Z',
			approvedAt: '2026-04-20T01:00:00.000Z',
			rejectedAt: null,
			adminNotes: null,
		},
		wallet: {
			custodyMode: 'self_custody',
			primaryWalletAddress:
				'GBRPVMU63WE636GZU5LUWNBX275LO66YFI4PIZ5HTQHYF2VM5AYV7M6V',
			walletStatus: 'configured',
			walletConnectionState: 'connected',
			walletLabel: 'Treasury wallet',
			lastUpdatedAt: '2026-04-20T02:00:00.000Z',
			walletConnectedAt: '2026-04-20T02:00:00.000Z',
			custodyChangeStatus: 'none',
			custodyChangeRequestedAt: null,
			requestedCustodyMode: null,
			requiresComplianceReview: true,
			hasExistingLiveProjects: false,
			liveProjectCount: 0,
			explanatoryCopy: {
				selfCustody:
					'Self custody means assets are held in the developer-controlled wallet.',
				regenxCustody:
					'RegenX custody means assets are managed under RegenX custody arrangements.',
				warning:
					'Changing wallet or custody may affect issuance or settlement and may require review.',
			},
		},
		entityLinkage: {
			primaryLegalEntity: 'RegenX Climate Holdings Pty Ltd',
			operatingEntity: 'RegenX Climate',
			linkedSpvName: 'Not yet linked',
			linkedSpvStatus: 'Not yet linked',
			offeringRole: 'Not yet linked',
			relatedProjects: [],
		},
	};

	beforeEach(() => {
		cy.signIn('climateDeveloper');
		cy.interceptApi(
			'/developer-profile/settings',
			{ method: 'GET' },
			settingsSummary,
		).as('getSettings');
		cy.visit('/settings');
		cy.wait('@getSettings');
	});

	it('renders safely when SPV linkage is absent', () => {
		cy.getBySel('settings-linked-spv-name').should(
			'contain.text',
			'Not yet linked',
		);
		cy.getBySel('settings-linked-spv-status').should(
			'contain.text',
			'Not yet linked',
		);
		cy.getBySel('settings-entity-linkage-empty').should('be.visible');
	});

	it('does not replace the wallet until confirmation is submitted', () => {
		cy.interceptApi(
			'/developer-profile/settings/wallet',
			{ method: 'PATCH' },
			(req) => {
				req.reply({
					...settingsSummary.wallet,
					primaryWalletAddress: req.body.walletAddress,
					walletLabel: req.body.walletLabel,
				});
			},
		).as('updateWallet');

		cy.getBySel('settings-replace-wallet').click();
		cy.getBySel('settings-wallet-modal').should('be.visible');
		cy.getBySel('settings-wallet-modal-address')
			.clear()
			.type('GCKFBEIYTKP6OE2QWJWOMQ7N4I6Y2UQK6L6T6O6B4XOXO6P5G4VJ5V7A');
		cy.get('@updateWallet.all').should('have.length', 0);
		cy.getBySel('settings-wallet-modal-submit-btn').click();
		cy.wait('@updateWallet');
		cy.getBySel('settings-wallet-address').should(
			'contain.text',
			'GCKFBEIYTKP6OE2QWJWOMQ7N4I6Y2UQK6L6T6O6B4XOXO6P5G4VJ5V7A',
		);
	});
});
