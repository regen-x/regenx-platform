import { useState } from 'react';

const Section = ({
	title,
	content,
	accepted,
	onAccept,
}: {
	title: string;
	content: string;
	accepted: boolean;
	onAccept: () => void;
}) => {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h3 className="text-lg font-semibold text-[#111827] mb-4">{title}</h3>

			<div className="max-h-[320px] overflow-y-auto break-words rounded-xl border border-slate-200 p-4 text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
				{content}
			</div>

			<div className="mt-4 flex items-center gap-2">
				<input type="checkbox" checked={accepted} onChange={onAccept} />
				<span className="text-sm text-[#111827]">
					I have read and agree to this section
				</span>
			</div>
		</div>
	);
};

export default function AgreementSections({
	onAllAccepted,
}: {
	onAllAccepted: (v: boolean) => void;
}) {
	const [platformAccepted, setPlatformAccepted] = useState(false);
	const [developerAccepted, setDeveloperAccepted] = useState(false);
	const [tokenAccepted, setTokenAccepted] = useState(false);

	const allAccepted = platformAccepted && developerAccepted && tokenAccepted;

	onAllAccepted(allAccepted);

	const platformAgreement = `RegenX Platform Agreement

1. Role of RegenX
RegenX operates a technology and infrastructure platform that facilitates access to climate-positive investment opportunities, including renewable energy and infrastructure assets.

RegenX provides project onboarding, investor access, transaction orchestration, and reporting functionality.

RegenX does not issue financial products, does not provide custody, and does not act as trustee or responsible entity.

2. No Financial Advice
All information presented is general in nature and does not constitute financial product advice.

RegenX does not consider your objectives, financial situation, or needs.

You must obtain independent financial, legal, and tax advice before making any investment decision.

3. Platform Functionality
RegenX provides infrastructure to:
• onboard projects
• connect investors
• facilitate transaction flows
• display performance and reporting data

Blockchain or distributed ledger technology may be used as a settlement and record layer.

4. Custody and Asset Control
Digital assets and tokenised representations are held via institutional custody providers (including Fireblocks, Zodia Custody, or equivalent).

RegenX does not hold private keys in production environments.

Custody providers manage:
• wallet infrastructure
• transaction signing
• asset security

5. Legal Ownership and Registry
Legal ownership is determined by the governing legal structure (including SPVs, Managed Investment Schemes, or equivalent structures).

The official register is maintained by the trustee, registry provider, or fund administrator.

Blockchain balances are a technical representation and do not override the legal register.

6. Risk Disclosure
Investments involve risk, including:
• loss of capital
• illiquidity
• project underperformance
• regulatory changes
• counterparty risk
• technology risks

Returns are not guaranteed.

7. Liquidity
Secondary trading or transfer mechanisms may be facilitated.

Liquidity is not guaranteed and exit timing is uncertain.

8. Accuracy of Information
RegenX relies on information provided by project developers and third parties.

RegenX does not guarantee completeness or accuracy.

9. Technology Risks
Users acknowledge risks including:
• system failures
• smart contract risks
• custody provider risks
• irreversible transactions

10. Fees
Fees may include:
• subscription fees
• capital raising fees
• transaction fees

11. Limitation of Liability
To the extent permitted by law, RegenX disclaims liability for losses arising from use of the platform.

12. Acceptance
By proceeding, you confirm acceptance of this agreement.`;

	const developerDeclaration = `Project Developer Declaration

By submitting a project, you confirm:

1. Accuracy
All information is true, complete, and not misleading.

2. Financial Assumptions
Financial projections are:
• reasonable
• supportable
• not misleading

3. Contracts
All referenced agreements:
• exist or are genuinely in progress
• are not misrepresented

4. Compliance
The project complies with:
• energy regulations
• environmental approvals
• applicable laws

5. Authority
You have authority over the project, SPV, or development rights.

6. Structure Acknowledgement
You acknowledge:
• investments may be structured via SPVs or MIS
• investor rights are governed by legal documents
• tokens may represent economic exposure, not direct legal ownership

7. Ongoing Disclosure
You agree to:
• update material changes
• disclose adverse developments
• maintain transparency

8. Data Reporting
You will provide accurate operational and financial data.

9. No Misrepresentation
You have not engaged in misleading or deceptive conduct.

10. Indemnity
You indemnify RegenX against losses arising from incorrect information.

11. Enforcement
False information may result in removal and legal action.

12. Acceptance
You confirm acceptance of this declaration.`;

	const tokenTerms = `Tokenised Offering Terms

1. Nature of Investment
Investments represent an interest in a structured project, typically through an SPV, Managed Investment Scheme, or equivalent legal structure.

2. Legal Structure
Investor rights are governed by formal legal documentation, including:
• trust deed
• offering documents
• SPV agreements

3. Token Representation
Tokens may represent:
• economic interests
• entitlement to distributions
• operational tracking of ownership

Tokens do not override legal ownership records.

4. Custody
Assets are held through institutional custody providers (such as Fireblocks or Zodia Custody).

Investors do not directly manage private keys unless explicitly enabled.

5. Revenue and Distributions
Investors may receive distributions based on project performance after costs and fees.

6. No Guaranteed Returns
Returns are variable and not guaranteed.

7. Liquidity
Secondary trading may be available but:
• liquidity is not guaranteed
• exit timing is uncertain

8. Investment Term
Investments may be long-term and aligned with asset life.

9. Risks
Risks include:
• project performance risk
• liquidity risk
• regulatory risk
• custody and technology risk

10. Regulatory Status
Investments may be financial products under applicable law and may be restricted to wholesale investors.

11. Acceptance
By participating, you confirm acceptance of these terms.`;

	return (
		<div className="space-y-6">
			<Section
				title="Platform Agreement"
				content={platformAgreement}
				accepted={platformAccepted}
				onAccept={() => setPlatformAccepted(!platformAccepted)}
			/>

			<Section
				title="Project Developer Declaration"
				content={developerDeclaration}
				accepted={developerAccepted}
				onAccept={() => setDeveloperAccepted(!developerAccepted)}
			/>

			<Section
				title="Tokenised Offering Terms"
				content={tokenTerms}
				accepted={tokenAccepted}
				onAccept={() => setTokenAccepted(!tokenAccepted)}
			/>
		</div>
	);
}
