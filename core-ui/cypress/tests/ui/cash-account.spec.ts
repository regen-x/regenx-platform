describe('/cash-account', () => {
	beforeEach(() => {
		cy.interceptApi(
			'/transactions/me**',
			{ method: 'GET' },
			{
				body: {
					data: [
						{
							type: 'transaction',
							id: '101',
							attributes: {
								createdAt: '2026-04-22T09:15:00.000Z',
								amount: 25000,
								type: 'BUY',
								project: {
									name: 'Solar Orchard Alpha',
								},
							},
						},
					],
				},
			},
		).as('getTransactions');
	});

	it('Should render correctly', () => {
		cy.signIn();
		cy.visit('/cash-account');
		cy.wait('@getTransactions');
		cy.getBySel('cash-account').should('be.visible');
		cy.getBySel('cash-account-options').should('be.visible');
		cy.contains('Platform-managed custody and settlement').should('be.visible');
		cy.contains(
			'No wallet setup is required in the standard investment flow',
		).should('be.visible');
		cy.contains('Recent transactions').should('be.visible');
	});

	it('Should show recent transaction history without wallet setup', () => {
		cy.signIn();
		cy.visit('/cash-account');
		cy.wait('@getTransactions');
		cy.contains('Solar Orchard Alpha').should('be.visible');
		cy.contains('BUY').should('be.visible');
		cy.contains('$25,000.00').should('be.visible');
	});
});
