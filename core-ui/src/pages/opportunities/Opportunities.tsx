import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
	AdminEmptyState,
	AdminFilterBar,
	AdminPageHeader,
	AdminSectionCard,
} from '@/components/admin-ui';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import { projectService } from '@/services/project.service';

type Opportunity = {
	id: number;
	name: string;
	description?: string;
	status?: string;
	thumbnailUrl?: string | null;
	payloadJson?: any;
};

export default function Opportunities() {
	const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');

	useEffect(() => {
		fetchOpportunities();
	}, []);

	const fetchOpportunities = async () => {
		try {
			setLoading(true);

			const res = await projectService.getProjects();
			const data = Array.isArray(res) ? res : [];
			const visibleProjects = data.filter((p: Opportunity) =>
				['approved', 'issued', 'live'].includes(
					String(p.status || '').toLowerCase(),
				),
			);

			setOpportunities(visibleProjects);
		} catch (err) {
			console.error('Failed to load opportunities', err);
			setOpportunities([]);
		} finally {
			setLoading(false);
		}
	};

	const visibleOpportunities = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return opportunities;

		return opportunities.filter((opportunity) =>
			`${opportunity.name} ${opportunity.description || ''}`
				.toLowerCase()
				.includes(query),
		);
	}, [opportunities, search]);

	return (
		<div className="theme-page-shell min-h-full w-full px-4 py-4">
			<div className="w-full max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Investor Portal"
					title="Opportunities"
					description="Review live climate infrastructure opportunities with consistent project-stage context and investor-ready offering detail."
				/>

				<AdminFilterBar>
					<div className="relative min-w-0 max-w-[360px] flex-1">
						<Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 theme-text-secondary" />
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search opportunities"
							className="min-h-[50px] w-full rounded-[14px] border theme-border theme-card pl-11 pr-4 theme-text outline-none placeholder:text-[#9AA7BC]"
						/>
					</div>
				</AdminFilterBar>

				{loading ? (
					<AdminSectionCard>
						<div className="text-[13px] theme-text-secondary">
							Loading opportunities...
						</div>
					</AdminSectionCard>
				) : visibleOpportunities.length === 0 ? (
					<AdminEmptyState
						title="No opportunities yet"
						description="Projects will appear here once they are approved, issued, or live."
					/>
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
						{visibleOpportunities.map((opportunity) => (
							<OpportunityCard key={opportunity.id} project={opportunity} />
						))}
					</div>
				)}

				{!loading && visibleOpportunities.length > 0 ? (
					<AdminSectionCard
						className="mt-10"
						title="Understanding Project Stages"
						description="Each project is shown by stage so investors can quickly understand where the asset sits in its lifecycle, the associated risk profile, and why capital is being raised."
					>
						<div className="overflow-x-auto">
							<table className="min-w-full border-separate border-spacing-0 text-left">
								<thead>
									<tr>
										<th className="border-b border-[#E7ECF4] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#346FB6]">
											DSE Type
										</th>
										<th className="border-b border-[#E7ECF4] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#346FB6]">
											What It Means
										</th>
										<th className="border-b border-[#E7ECF4] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#346FB6]">
											Risk Level
										</th>
										<th className="border-b border-[#E7ECF4] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#346FB6]">
											Revenue Status
										</th>
										<th className="border-b border-[#E7ECF4] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#346FB6]">
											Why Funding is Needed
										</th>
									</tr>
								</thead>

								<tbody>
									<tr>
										<td className="border-b border-[#EEF2F7] px-4 py-4 font-semibold text-[#163F74]">
											Development
										</td>
										<td className="border-b border-[#EEF2F7] px-4 py-4 text-[#5F6C86]">
											Project is being planned and structured, progressing
											toward financial close
										</td>
										<td className="border-b border-[#EEF2F7] px-4 py-4 text-[#5F6C86]">
											High
										</td>
										<td className="border-b border-[#EEF2F7] px-4 py-4 text-[#5F6C86]">
											No revenue
										</td>
										<td className="border-b border-[#EEF2F7] px-4 py-4 text-[#5F6C86]">
											To fund feasibility, approvals, grid connection, and
											securing revenue contracts such as a PPA
										</td>
									</tr>

									<tr>
										<td className="border-b border-[#EEF2F7] px-4 py-4 font-semibold text-[#163F74]">
											Construction
										</td>
										<td className="border-b border-[#EEF2F7] px-4 py-4 text-[#5F6C86]">
											Project has reached financial close and is being built,
											moving toward operational status
										</td>
										<td className="border-b border-[#EEF2F7] px-4 py-4 text-[#5F6C86]">
											Medium
										</td>
										<td className="border-b border-[#EEF2F7] px-4 py-4 text-[#5F6C86]">
											Not yet active
										</td>
										<td className="border-b border-[#EEF2F7] px-4 py-4 text-[#5F6C86]">
											To fund staged capital requirements such as equipment,
											installation, and commissioning through to completion
										</td>
									</tr>

									<tr>
										<td className="px-4 py-4 font-semibold text-[#163F74]">
											Operating
										</td>
										<td className="px-4 py-4 text-[#5F6C86]">
											Asset is built, connected, and generating revenue
										</td>
										<td className="px-4 py-4 text-[#5F6C86]">Lower</td>
										<td className="px-4 py-4 text-[#5F6C86]">Active revenue</td>
										<td className="px-4 py-4 text-[#5F6C86]">
											To access existing cashflowing assets, refinance capital,
											or optimise capital structure
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div className="mt-5 text-[14px] font-medium text-[#163F74]">
							Development → Construction → Operating
						</div>
					</AdminSectionCard>
				) : null}
			</div>
		</div>
	);
}
