import { Printer, X } from 'lucide-react';

export type RpaSummarySection = {
	key: string;
	title: string;
	body: string;
};

export type RpaSummary = {
	title: string;
	subtitle: string;
	status: string;
	sections: RpaSummarySection[];
};

type RpaContentProps = {
	summary?: RpaSummary | null;
	isLoading?: boolean;
	error?: string;
};

const fallbackTitle = 'Revenue Participation Agreement Summary';
const fallbackSubtitle =
	'Structured investment summary generated from project inputs';

const renderParagraphs = (body: string) =>
	String(body || '')
		.split(/\n{2,}/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean)
		.map((paragraph, index) => (
			<p key={index} className="text-[14px] leading-[1.75] text-[#4B5870]">
				{paragraph}
			</p>
		));

export function RevenueParticipationAgreementContent({
	summary,
	isLoading = false,
	error = '',
}: RpaContentProps) {
	if (isLoading) {
		return (
			<div className="rounded-[16px] border border-[#E7ECF4] bg-white p-5 text-[14px] text-[#5F6C86]">
				Generating Revenue Participation Agreement Summary...
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-[16px] border border-[#F2C6C6] bg-[#FFF7F7] p-5 text-[14px] text-[#B42318]">
				{error}
			</div>
		);
	}

	if (!summary?.sections?.length) {
		return (
			<div className="rounded-[16px] border border-[#E7ECF4] bg-white p-5 text-[14px] text-[#5F6C86]">
				Save the project to generate the read-only RPA summary.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{summary.sections.map((section) => (
				<section
					key={section.key}
					className="rounded-[16px] border border-[#E7ECF4] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]"
				>
					<h4 className="text-[16px] font-semibold text-[#163F74]">
						{section.title}
					</h4>
					<div className="mt-3 space-y-3">
						{renderParagraphs(section.body || 'Not provided')}
					</div>
				</section>
			))}
		</div>
	);
}

type RevenueParticipationAgreementModalProps = RpaContentProps & {
	isOpen: boolean;
	onClose: () => void;
};

export default function RevenueParticipationAgreementModal({
	isOpen,
	onClose,
	summary,
	isLoading = false,
	error = '',
}: RevenueParticipationAgreementModalProps) {
	if (!isOpen) return null;

	const handleExport = () => {
		window.print();
	};

	return (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#0F172A]/55 px-4 py-6">
			<div className="relative flex max-h-[92vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-[24px] border border-[#D7DEEA] bg-[#F7F8FB] shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
				<div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#E7ECF4] bg-white px-6 py-5">
					<div>
						<div className="flex flex-wrap items-center gap-3">
							<h3 className="text-[24px] font-semibold text-[#163F74]">
								{summary?.title || fallbackTitle}
							</h3>
							<span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#123DA8]">
								{summary?.status || 'Read only'}
							</span>
						</div>
						<p className="mt-2 text-[14px] text-[#5F6C86]">
							{summary?.subtitle || fallbackSubtitle}
						</p>
					</div>

					<div className="flex shrink-0 items-center gap-2">
						<button
							type="button"
							onClick={handleExport}
							className="inline-flex items-center gap-2 rounded-[12px] border border-[#D7DEEA] bg-white px-4 py-2 text-[14px] font-semibold text-[#123DA8]"
						>
							<Printer className="h-4 w-4" />
							Export / Print PDF
						</button>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close RPA summary"
							className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#D7DEEA] bg-white text-[#123DA8]"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				</div>

				<div className="overflow-y-auto px-6 py-6">
					<RevenueParticipationAgreementContent
						summary={summary}
						isLoading={isLoading}
						error={error}
					/>
				</div>
			</div>
		</div>
	);
}
