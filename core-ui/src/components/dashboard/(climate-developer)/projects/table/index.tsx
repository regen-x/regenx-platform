import { useNavigate } from 'react-router-dom';

import Button from '@/components/common/button';
import InitialIcon from '@/components/common/initial-icon';
import Table, { TableColumn } from '@/components/common/table';
import { SOROBAN_TOKEN_EXPONENT } from '@/constants/common/stellar';
import { dashboardCardTableStyles } from '@/constants/dashboard/card-table-styles';
import { IProject } from '@/interfaces/api/IProject';

interface IDashboardProjectsCardTableProps {
	projects: IProject[];
}

const DashboardProjectsCardTable: React.FC<
	IDashboardProjectsCardTableProps
> = ({ projects }) => {
	const navigate = useNavigate();

	const cellClass = 'text-sm font-medium text-gray-800';

	const getProjectStatus = (project: IProject) => {
		const percentFunded = Number(project.percentFunded ?? 0);

		if (percentFunded >= 100) return 'Funded';
		if (percentFunded > 0) return 'Raising';
		return 'Not started';
	};

	const getStatusClasses = (status: string) => {
		switch (status) {
			case 'Funded':
				return 'bg-blue-100 text-blue-700';
			case 'Raising':
				return 'bg-pink-100 text-pink-700';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	};

	const tableColumns: TableColumn<IProject>[] = [
		{
			header: 'Name',
			accessor: 'name',
			dataTest: (row) => `project-item-name-${row.id}`,
			renderCell: (value, row) => (
				<div className="flex items-center gap-x-2">
					<InitialIcon
						className="h-6 w-6 bg-primary text-white"
						word={value as string}
					/>

					<div className="flex flex-col">
						<span className={cellClass}>{value as string}</span>

						<span className="block" data-test={`project-item-date-${row.id}`}>
							{(row as any)?.createdAt
								? new Date((row as any).createdAt).toLocaleString()
								: ''}
						</span>
					</div>
				</div>
			),
			shouldRender: true,
		},
		{
			header: 'Status',
			accessor: 'id',
			dataTest: (row) => `project-item-status-${row.id}`,
			renderCell: (_, row) => {
				const status = getProjectStatus(row);

				return (
					<span
						className={`rounded-full px-4 py-1.5 text-sm font-medium ${getStatusClasses(
							status,
						)}`}
					>
						{status}
					</span>
				);
			},
			shouldRender: true,
		},
		{
			header: 'Progress',
			accessor: 'percentFunded',
			dataTest: (row) => `project-item-progress-${row.id}`,
			renderCell: (value, row) => {
				const percent = Math.max(0, Math.min(100, Number(value ?? 0)));
				const isFunded = percent >= 100;

				const barColor = isFunded
					? 'bg-blue-500'
					: percent > 0
					? 'bg-pink-400'
					: 'bg-gray-300';

				const raised = Number((row as any).fundedSoFar ?? 0);
				const goal = Number((row as any).fundingGoal ?? 0);

				return (
					<div className="w-[300px]">
						<div className="mb-2 flex justify-between text-sm font-medium text-gray-800">
							<span>
								${raised.toLocaleString()} / ${goal.toLocaleString()}
							</span>
						</div>

						<div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
							<div
								className={`h-full rounded-full transition-all duration-500 ${barColor}`}
								style={{ width: `${percent}%` }}
							/>
						</div>

						<div className="mt-2 text-xs text-gray-500">
							{percent > 0 && percent < 1 ? '<1%' : `${percent.toFixed(0)}%`}{' '}
							funded
						</div>
					</div>
				);
			},
			shouldRender: true,
		},
		{
			header: 'Raised',
			accessor: 'fundedSoFar',
			dataTest: (row) => `project-item-raised-${row.id}`,
			renderCell: (value) => (
				<span className={cellClass}>
					${Number(value ?? 0).toLocaleString()}
				</span>
			),
			shouldRender: true,
		},
		{
			header: 'Goal',
			accessor: 'fundingGoal',
			dataTest: (row) => `project-item-goal-${row.id}`,
			renderCell: (value) => (
				<span className={cellClass}>
					${Number(value ?? 0).toLocaleString()}
				</span>
			),
			shouldRender: true,
		},
		{
			header: 'Price',
			accessor: 'tokenPrice',
			dataTest: (row) => `project-item-price-${row.id}`,
			renderCell: (value) => (
				<span className={cellClass}>
					$
					{Number(Number(value ?? 0) / SOROBAN_TOKEN_EXPONENT).toLocaleString()}
				</span>
			),
			shouldRender: true,
		},
		{
			header: 'Remaining',
			accessor: 'remainingSupply',
			dataTest: (row) => `project-item-remaining-${row.id}`,
			renderCell: (value, row) => {
				const units = Number(value ?? 0);
				const price =
					Number((row as any).tokenPrice ?? 0) / SOROBAN_TOKEN_EXPONENT;
				const dollarValue = units * price;

				return (
					<div className="flex flex-col">
						<span className={cellClass}>{units.toLocaleString()} units</span>
						<span className="text-sm text-gray-500">
							${dollarValue.toLocaleString()}
						</span>
					</div>
				);
			},
			shouldRender: true,
		},
		{
			header: 'Actions',
			accessor: 'id',
			dataTest: (row) => `project-item-actions-${row.id}`,
			renderCell: (id) => (
				<Button
					type="button"
					dataTest={`project-item-properties-${id}`}
					className="w-[120px] justify-center rounded-full px-4 py-1 text-custom-dark-blue"
					onClick={() => navigate(`/project/${id}`)}
				>
					View
				</Button>
			),
			shouldRender: true,
		},
	];

	return (
		<div className="max-h-[20rem] w-full overflow-auto">
			<Table
				columns={tableColumns}
				data={projects}
				{...dashboardCardTableStyles}
				dataTest="dashboard-projects"
			/>
		</div>
	);
};

export default DashboardProjectsCardTable;
