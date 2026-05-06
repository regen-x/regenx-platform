const formatAgreementEffectiveDate = () =>
	new Intl.DateTimeFormat('en-AU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(new Date());

const getClimateDeveloperPlatformAgreement = (effectiveDate: string) =>
	`RegenX Platform Agreement (Climate Developer)

Effective Date: ${effectiveDate}

This Platform Agreement (“Agreement”) is entered into between RegenX Group Pty Ltd (“RegenX”, “we”, “us”) and the entity or individual registering as a Climate Developer on the RegenX platform (“Developer”, “you”).

By accessing, registering for, or using the RegenX platform, you acknowledge that you have read, understood, and agree to be bound by this Agreement.

1. Purpose of the Platform

RegenX operates a digital infrastructure platform designed to support the structuring, presentation, administration, and transaction orchestration of climate-positive infrastructure projects, including renewable energy systems, battery storage assets, and sustainability-linked infrastructure.

The platform enables Developers to submit projects, provide project data, define commercial assumptions, and make eligible opportunities available for review by RegenX, its regulated partners, and eligible investors.

RegenX provides technology infrastructure, workflow tools, reporting functionality, and digital settlement orchestration. RegenX does not provide financial product advice, personal advice, legal advice, tax advice, or investment recommendations.

Unless expressly stated in separate legal documentation, RegenX does not act as the issuer, trustee, responsible entity, fund administrator, registry provider, or production custodian of any investment product.

2. Legal Structure and Offering Documents

Projects submitted to RegenX may be structured through one or more legal vehicles, including special purpose vehicles, managed investment schemes, project trusts, revenue participation arrangements, or other approved structures.

Investor rights, ownership interests, distributions, fees, risks, transfer rights, and obligations will be governed by the relevant legal and offering documents for each project. These may include an Information Memorandum, trust deed, constitution, investment management agreement, subscription agreement, project agreement, power purchase agreement, revenue agreement, or other project-specific documents.

If there is any inconsistency between this Agreement and project-specific legal or offering documents, the project-specific legal or offering documents will prevail.

3. Role of Regulated and Custody Partners

RegenX may work with third-party regulated service providers, trustees, responsible entities, fund administrators, registry providers, custodians, payment providers, and digital asset custody providers.

Legal ownership and investor registers may be maintained by a trustee, registry provider, fund administrator, or other regulated partner.

Digital assets or tokenised records may be held or controlled through institutional custody providers, including Fireblocks, Zodia Custody, or equivalent providers, where applicable.

RegenX does not hold production private keys and does not operate as a production digital asset custodian unless expressly stated in a separate written agreement.

4. Tokenisation and Digital Infrastructure

The RegenX platform may use blockchain, distributed ledger technology, tokenised records, or digital asset infrastructure to support settlement, transaction tracking, ownership reflection, auditability, transfer workflows, or reporting.

Any token, ledger entry, or digital record used in connection with a project is a technical representation of rights or interests defined by the relevant legal documents. It does not override the official legal register, trustee records, fund registry, or offering documents.

Blockchain balances or token records may be used as a settlement and transparency layer, but the legal nature of each investment is determined by the relevant project structure and documents.

5. Developer Obligations

You agree to act honestly, in good faith, and with reasonable care in all activities conducted through the platform.

You warrant that all information provided to RegenX is true, accurate, complete, current, and not misleading. This includes project descriptions, ownership information, technical specifications, financial models, revenue assumptions, contracts, permits, approvals, impact metrics, operational data, and supporting documents.

You must promptly update RegenX if any information becomes inaccurate, incomplete, misleading, or materially outdated.

6. Authority and Project Rights

You warrant that you are authorised to submit the project and act on behalf of the relevant project entity, asset owner, developer, sponsor, or rights holder.

You warrant that you have, or will obtain before listing or capital raising, all necessary rights, permissions, approvals, consents, and authority required to submit the project, disclose project information, and participate in any proposed transaction or capital raising process.

7. Legal and Regulatory Compliance

You are responsible for ensuring that your project, project entity, asset ownership, contracts, development rights, permits, investor communications, and capital raising activities comply with all applicable laws and regulations.

This may include laws relating to corporations, financial services, managed investment schemes, fundraising, energy markets, environmental approvals, planning approvals, consumer protection, privacy, anti-money laundering, sanctions, and taxation.

RegenX may review project information before allowing a project to progress on the platform. However, any review by RegenX does not constitute legal, financial, technical, tax, regulatory, or investment approval.

8. Project Information, Financial Models, and Forecasts

You are responsible for the accuracy and reasonableness of all project information, assumptions, forecasts, models, and projections.

You must ensure that financial projections, expected returns, revenue forecasts, production assumptions, savings assumptions, operating costs, capital expenditure, and impact metrics are based on reasonable assumptions and supporting evidence.

You must not provide fabricated, exaggerated, deceptive, or unsupported information.

9. Contracts and Commercial Arrangements

Where a project refers to contracts, commercial arrangements, offtake agreements, power purchase agreements, revenue agreements, leases, site access rights, grid connection arrangements, supply agreements, or other material arrangements, you warrant that such arrangements either exist, are under genuine negotiation, or are clearly disclosed as assumptions.

You must not represent any agreement as binding, final, executed, or certain unless that is true.

10. Ongoing Disclosure and Reporting

You agree to provide ongoing updates to RegenX regarding project status, milestones, delays, risks, operational performance, revenue performance, material incidents, regulatory matters, and other information reasonably required for investor reporting or platform administration.

You agree to notify RegenX promptly of any material adverse change affecting the project, project entity, asset, revenue assumptions, investor disclosures, or ability to perform obligations.

11. Data and Platform Use

You grant RegenX a non-exclusive, royalty-free licence to use, reproduce, display, process, and disclose project information, documents, data, images, forecasts, and metrics for the purposes of operating the platform, reviewing projects, preparing investor materials, supporting transaction workflows, reporting to investors, and promoting eligible opportunities.

You must not upload malicious code, unlawful content, confidential third-party information without authority, or any content that infringes intellectual property or privacy rights.

12. Fees and Commercial Terms

RegenX may charge fees for platform access, project onboarding, capital raising support, transaction processing, administration, reporting, or other services.

Capital raising fees may typically range from 3% to 5% of funds successfully raised, unless otherwise agreed in writing.

All applicable fees will be disclosed in relevant commercial terms, platform notices, engagement letters, or project-specific documentation.

All fees are exclusive of GST unless otherwise stated.

13. Risk Disclosure

You acknowledge that climate infrastructure projects and related capital raising activities involve risk, including project delays, construction risk, operational underperformance, cost overruns, revenue volatility, counterparty risk, regulatory change, limited liquidity, technology failure, and failure to raise capital.

RegenX does not guarantee that any project will be approved, listed, funded, completed, generate revenue, achieve forecast returns, or provide liquidity.

14. Role of RegenX

RegenX may review, request changes to, approve, decline, suspend, or remove projects from the platform at its discretion.

Any review by RegenX is for platform, risk, operational, or presentation purposes only and does not constitute endorsement, verification, certification, or approval of the project’s legal, financial, technical, environmental, or investment merits.

RegenX does not act as agent, adviser, fiduciary, trustee, responsible entity, or custodian for the Developer unless expressly agreed in writing.

15. Limitation of Liability

To the maximum extent permitted by law, RegenX excludes liability for indirect, incidental, special, consequential, punitive, or economic loss, including loss of profits, revenue, opportunity, goodwill, data, or anticipated savings.

RegenX is not liable for losses arising from project performance, investor participation, reliance on Developer-provided information, third-party service providers, custody providers, blockchain networks, payment providers, or regulatory decisions.

Where liability cannot be excluded, RegenX’s aggregate liability is limited to the fees paid by the Developer to RegenX in the twelve months preceding the event giving rise to the claim.

16. Indemnity

You indemnify RegenX, its directors, officers, employees, contractors, affiliates, and partners against any claims, losses, damages, liabilities, costs, or expenses arising from or connected with:

• your breach of this Agreement
• inaccurate, incomplete, misleading, or outdated information
• your project or project entity
• your failure to obtain required rights, permits, approvals, or consents
• regulatory breaches
• investor disputes caused by Developer-provided information
• fraud, negligence, misconduct, or unlawful activity

17. Suspension and Termination

RegenX may suspend, restrict, or terminate your access to the platform at any time where reasonably required for compliance, risk management, operational, legal, regulatory, security, or commercial reasons.

Upon termination, RegenX may remove or restrict access to project listings. Existing investor arrangements, legal obligations, and project-specific documents may continue according to their terms.

Termination does not affect accrued rights, obligations, confidentiality obligations, indemnities, limitations of liability, or any provisions intended to survive termination.

18. Intellectual Property

RegenX retains all rights, title, and interest in the platform, software, systems, workflows, branding, designs, documentation, analytics, models, and proprietary technology.

You retain ownership of project information and materials you provide, subject to the licence granted to RegenX under this Agreement.

19. Confidentiality

Each party must keep confidential any non-public information received from the other party, except where disclosure is required by law, regulation, professional advisers, service providers, investors, regulated partners, or for the proper operation of the platform.

20. Electronic Communications

You consent to receiving communications, notices, agreements, disclosures, updates, and records electronically through the platform, email, or other registered contact details.

Electronic communications are deemed received when sent unless delivery failure is notified.

21. Privacy

RegenX may collect, use, store, and disclose personal information in accordance with its Privacy Policy and applicable privacy laws.

You must ensure that any personal information you provide has been collected and disclosed lawfully.

22. Changes to this Agreement

RegenX may update this Agreement from time to time. Continued access to or use of the platform after an updated Agreement is made available constitutes acceptance of the updated terms.

23. Governing Law

This Agreement is governed by the laws of New South Wales, Australia.

The parties submit to the exclusive jurisdiction of the courts of New South Wales.

24. Acceptance

By proceeding, you confirm that you have read, understood, and accepted this Agreement.`;

const parseAgreementContent = (content: string) => {
	const lines = content
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
	const [title = '', effectiveDate = '', ...bodyLines] = lines;
	const sections: Array<{
		number: string;
		title: string;
		items: Array<{ type: 'paragraph' | 'bullet'; text: string }>;
	}> = [];
	const intro: string[] = [];

	bodyLines.forEach((line) => {
		const heading = line.match(/^(\d+)\.\s+(.+)$/);
		if (heading) {
			sections.push({ number: heading[1], title: heading[2], items: [] });
			return;
		}

		const current = sections[sections.length - 1];
		if (!current) {
			intro.push(line);
			return;
		}

		current.items.push(
			line.startsWith('• ')
				? { type: 'bullet', text: line.slice(2) }
				: { type: 'paragraph', text: line },
		);
	});

	return { title, effectiveDate, intro, sections };
};

const PlatformAgreementContent = () => {
	const agreementText = getClimateDeveloperPlatformAgreement(
		formatAgreementEffectiveDate(),
	);
	const agreement = parseAgreementContent(agreementText);

	return (
		<div className="max-h-[520px] overflow-y-auto rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 text-sm leading-6 text-[#374151]">
			<div className="border-b border-[#E5E7EB] pb-4">
				<h3 className="text-lg font-semibold leading-tight text-[#0F6A99]">
					{agreement.title}
				</h3>
				<div className="mt-2 inline-flex rounded-full border border-[#D6E4F0] bg-white px-3 py-1 text-xs font-semibold text-[#64748B]">
					{agreement.effectiveDate}
				</div>
			</div>

			<div className="mt-4 space-y-3">
				{agreement.intro.map((paragraph) => (
					<p key={paragraph} className="text-[#475569]">
						{paragraph}
					</p>
				))}
			</div>

			<div className="mt-5 space-y-5">
				{agreement.sections.map((section) => (
					<section
						key={`${section.number}-${section.title}`}
						className="rounded-xl border border-[#E5E7EB] bg-white p-4"
					>
						<h4 className="flex gap-2 text-[15px] font-semibold leading-snug text-[#111827]">
							<span className="shrink-0 text-[#0F6A99]">{section.number}.</span>
							<span>{section.title}</span>
						</h4>
						<div className="mt-3 space-y-2.5">
							{section.items.map((item, index) =>
								item.type === 'bullet' ? (
									<div
										key={`${section.number}-${index}`}
										className="flex gap-2 text-[#475569]"
									>
										<span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0F6A99]" />
										<span>{item.text}</span>
									</div>
								) : (
									<p
										key={`${section.number}-${index}`}
										className="text-[#475569]"
									>
										{item.text}
									</p>
								),
							)}
						</div>
					</section>
				))}
			</div>
		</div>
	);
};

export default PlatformAgreementContent;
