describe('/admin/investor-approvals', () => {
	it('renders the queue and exposes Testing Only controls in the row and detail panel', () => {
		cy.signIn();

		const queueRow = {
			id: 17,
			userId: '42',
			email: 'investor@example.com',
			fullname: 'Investor QA',
			phoneNumber: '+61000000000',
			sumsubApplicantId: null,
			sumsubStatus: 'pending',
			adminReviewStatus: 'pending',
			investorEligibilityStatus: 'approved',
			wholesaleStatus: 'pending',
			wholesaleCertificateOriginalName: null,
			wholesaleCertificateExpiryDate: null,
			reviewNotes: null,
			reviewedAt: null,
			reviewedBy: null,
			eligibilitySource: 'test_override',
			verificationOverrideMode: 'testnet',
			testOverrideActive: true,
			testInvestmentOverride: true,
			testInvestmentOverrideSetAt: '2026-04-22T00:00:00.000Z',
			testInvestmentOverrideSetBy: '7',
			testInvestmentOverrideNote: 'Regression coverage',
			isEligible: true,
			reviewState: 'testing_only',
		};

		cy.interceptApi(
			'/investor-verification/admin',
			{ method: 'GET' },
			{ body: [queueRow] },
		).as('getInvestorApprovals');

		cy.interceptApi(
			'/investor-verification/admin/42',
			{ method: 'GET' },
			{
				body: {
					...queueRow,
					amlAnswers: null,
				},
			},
		).as('getInvestorApprovalDetail');

		cy.visit('/admin/investor-approvals');
		cy.wait('@getInvestorApprovals');

		cy.getBySel('admin-investor-approvals').should('be.visible');
		cy.getBySel('investor-approval-row-42').should(
			'contain.text',
			'Investor QA',
		);
		cy.getBySel('investor-approval-test-mode-42').should(
			'contain.text',
			'Disable Test Override',
		);

		cy.getBySel('investor-approval-detail-42').click();
		cy.wait('@getInvestorApprovalDetail');
		cy.getBySel('investor-approval-detail-test-mode').should(
			'contain.text',
			'Disable Test Override',
		);
	});
});
