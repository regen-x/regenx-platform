import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '@/components/common/button';
import Loader from '@/components/common/loader';
import DashboardProjectsCardTable from '@/components/dashboard/(climate-developer)/projects/table';
import { UserType } from '@/constants/enum/user-type.enum';
import { IProject } from '@/interfaces/api/IProject';
import { notificationService } from '@/services/notification.service';
import { projectService } from '@/services/project.service';
import { useUserStore } from '@/store/user.store';

const DashboardProjectsCard: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useUserStore();

	const [projects, setProjects] = useState<IProject[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const handleGetProjects = useCallback(async () => {
		try {
			if (!user || user.type !== UserType.CLIMATE_DEVELOPER) {
				setProjects([]);
				setIsLoading(false);
				return;
			}

			setIsLoading(true);

			const response = await projectService.getMyProjects();
			setProjects(Array.isArray(response) ? response : []);
		} catch (error) {
			console.error(error);
			notificationService.error(
				'An error occurred while fetching user projects',
			);
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	useEffect(() => {
		handleGetProjects();
	}, [handleGetProjects]);

	const getProjectNumber = (project: IProject, keys: string[]) => {
		const value = keys.find((key) => {
			const projectValue = (project as any)?.[key];
			return (
				projectValue !== undefined &&
				projectValue !== null &&
				projectValue !== ''
			);
		});

		if (!value) return 0;

		const parsed = Number((project as any)[value]);
		return Number.isFinite(parsed) ? parsed : 0;
	};

	const getProjectRaised = (project: IProject) =>
		getProjectNumber(project, ['fundedSoFar', 'raised', 'totalRaised']);

	const getProjectGoal = (project: IProject) =>
		getProjectNumber(project, [
			'goalAmount',
			'targetAmount',
			'goal',
			'projectValue',
			'value',
			'fundingGoal',
		]);

	const getProjectPercentFunded = (project: IProject) => {
		const explicitPercent = getProjectNumber(project, [
			'percentFunded',
			'percentageFunded',
			'fundedPercent',
		]);

		if (explicitPercent > 0) return explicitPercent;

		const raised = getProjectRaised(project);
		const goal = getProjectGoal(project);

		if (!goal) return 0;
		return (raised / goal) * 100;
	};

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat('en-AU', {
			style: 'currency',
			currency: 'AUD',
			maximumFractionDigits: 0,
		}).format(value);

	const summary = useMemo(() => {
		const totalRaised = projects.reduce(
			(sum, project) => sum + getProjectRaised(project),
			0,
		);

		const projectsRaising = projects.filter(
			(project) => getProjectPercentFunded(project) < 100,
		).length;

		const projectsFunded = projects.filter(
			(project) => getProjectPercentFunded(project) >= 100,
		).length;

		const capitalRemaining = projects.reduce((sum, project) => {
			const goal = getProjectGoal(project);
			const raised = getProjectRaised(project);
			return sum + Math.max(goal - raised, 0);
		}, 0);

		const actionsRequired = projects.filter((project) => {
			const percent = getProjectPercentFunded(project);
			return percent < 25 || percent >= 100;
		}).length;

		return {
			totalRaised,
			projectsRaising,
			projectsFunded,
			capitalRemaining,
			actionsRequired,
		};
	}, [projects]);

	const getProjectAlert = (project: IProject) => {
		const percent = Number(getProjectPercentFunded(project));

		if (percent >= 100) {
			return {
				alert: '100% funded — ready for close-out',
				actionLabel: 'Review',
			};
		}

		if (percent >= 75) {
			return {
				alert: '75% funded — nearing close',
				actionLabel: 'View project',
			};
		}

		if (percent >= 50) {
			return {
				alert: '50% funded — halfway milestone',
				actionLabel: 'View project',
			};
		}

		if (percent >= 25) {
			return {
				alert: '25% funded — momentum starting',
				actionLabel: 'View project',
			};
		}

		if (percent > 0) {
			return {
				alert: 'Less than 25% funded — early traction',
				actionLabel: 'View project',
			};
		}

		return {
			alert: '0% funded — no capital raised yet',
			actionLabel: 'View project',
		};
	};

	const summaryCards = [
		{
			title: 'Total Raised',
			value: formatCurrency(summary.totalRaised),
			subtitle: `Across ${projects.length} project${
				projects.length === 1 ? '' : 's'
			}`,
			bgClass: 'bg-gradient-to-br from-sky-50 via-white to-sky-50/40',
			accentClass: 'bg-sky-400',
		},
		{
			title: 'Projects Raising',
			value: String(summary.projectsRaising),
			subtitle: 'Currently open to investors',
			bgClass: 'bg-gradient-to-br from-pink-50 via-white to-pink-50/40',
			accentClass: 'bg-pink-400',
		},
		{
			title: 'Projects Funded',
			value: String(summary.projectsFunded),
			subtitle: 'Ready for close out or reporting',
			bgClass: 'bg-gradient-to-br from-sky-50 via-white to-sky-50/40',
			accentClass: 'bg-sky-400',
		},
		{
			title: 'Capital Remaining',
			value: formatCurrency(summary.capitalRemaining),
			subtitle: 'Still available across active raises',
			bgClass: 'bg-gradient-to-br from-sky-50 via-white to-sky-50/40',
			accentClass: 'bg-sky-400',
		},
		{
			title: 'Action Required',
			value: String(summary.actionsRequired),
			subtitle: 'Needs review or more traction',
			bgClass: 'bg-gradient-to-br from-pink-50 via-white to-pink-50/40',
			accentClass: 'bg-pink-500',
		},
	];

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
				{summaryCards.map((card) => (
					<div
						key={card.title}
						className={`relative overflow-hidden rounded-xl border border-slate-100 p-5 shadow-sm ${card.bgClass}`}
					>
						<div
							className={`absolute left-0 top-0 h-full w-1.5 ${card.accentClass}`}
						/>
						<p className="text-sm font-medium text-slate-500">{card.title}</p>
						<h3 className="mt-2 text-3xl font-bold text-slate-900">
							{card.value}
						</h3>
						<p className="mt-2 text-sm text-slate-500">{card.subtitle}</p>
					</div>
				))}
			</div>

			<div
				className="rounded-xl bg-white p-6 shadow"
				data-test="dashboard-card-user-projects"
			>
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold">Deal Room</h3>
				</div>

				<div className="mb-4 border-t border-gray-200" />

				{isLoading ? (
					<div className="flex justify-center py-8">
						<Loader />
					</div>
				) : projects.length ? (
					<DashboardProjectsCardTable projects={projects} />
				) : (
					<div className="py-8 text-center">
						<p
							className="font-medium text-gray-900"
							data-test="dashboard-card-empty-user-projects"
						>
							We couldn't find any recent projects
						</p>
						<p className="mt-1 text-sm text-gray-500">
							Complete your project workflow to create your first project.
						</p>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<div className="rounded-xl bg-white p-6 shadow">
					<h3 className="mb-2 text-lg font-semibold">Alerts & Actions</h3>
					<div className="mb-4 border-t border-gray-200" />

					{isLoading ? (
						<div className="flex justify-center py-8">
							<Loader />
						</div>
					) : projects.length ? (
						<div className="max-h-[260px] overflow-y-auto">
							<table className="w-full border-separate border-spacing-y-2 text-left">
								<thead>
									<tr className="text-sm text-gray-500">
										<th className="pb-2 font-medium">Project</th>
										<th className="pb-2 font-medium">Alert</th>
										<th className="pb-2 font-medium">Action</th>
									</tr>
								</thead>
								<tbody>
									{projects.map((project) => {
										const { alert, actionLabel } = getProjectAlert(project);

										return (
											<tr key={project.id} className="bg-white">
												<td className="py-3 pr-4 font-medium text-gray-900">
													{project.name}
												</td>
												<td className="py-3 pr-4 text-sm text-gray-600">
													{alert}
												</td>
												<td className="py-3">
													<Button
														type="button"
														dataTest={`project-alert-action-${project.id}`}
														className="mt-0 w-[160px] justify-center rounded-full px-4 py-1 text-custom-dark-blue"
														onClick={() =>
															project.id && navigate(`/project/${project.id}`)
														}
													>
														{actionLabel}
													</Button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					) : (
						<div className="py-8 text-center">
							<p className="font-medium text-gray-900">No alerts yet</p>
							<p className="mt-1 text-sm text-gray-500">
								Alerts will appear here once projects are active.
							</p>
						</div>
					)}
				</div>

				<div className="rounded-xl bg-white p-6 shadow">
					<h3 className="mb-2 text-lg font-semibold">Next Module</h3>
					<div className="mb-4 border-t border-gray-200" />

					<div className="py-8 text-center">
						<p className="font-medium text-gray-900">Reserved space</p>
						<p className="mt-1 text-sm text-gray-500">
							This will hold documents, raise activity, or milestones.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DashboardProjectsCard;
