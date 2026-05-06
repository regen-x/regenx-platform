import { useNavigate } from 'react-router-dom';

import TokenLink from '@/components/common/TokenLink';
import Button from '@/components/common/button';
import InitialIcon from '@/components/common/initial-icon';
import Table, { TableColumn } from '@/components/common/table';
import { dashboardCardTableStyles } from '@/constants/dashboard/card-table-styles';
import { TransactionTypeLabels } from '@/constants/enum/transaction-type.enum';
import { IProject } from '@/interfaces/api/IProject';
import { ITransaction } from '@/interfaces/api/ITransaction';

interface IDashboardInvestmentsCardTableProps {
	investments: ITransaction[];
}

type StatusType = 'success' | 'warning' | 'pending';

interface IInvestorStatus {
	label: string;
	type: StatusType;
	count: number;
}

const DashboardInvestmentsCardTable: React.FC<
	IDashboardInvestmentsCardTableProps
> = ({ investments }: IDashboardInvestmentsCardTableProps) => {
	const navigate = useNavigate();

	const getInvestorStatus = (row: ITransaction): IInvestorStatus => {
		const project = row.project as IProject;

		if (!project) {
			return { label: 'Pending Setup', type: 'pending', count: 0 };
		}

		if (
			(project as any).bankConnected === false ||
			(project as any).kycComplete === false
		) {
			return { label: 'Action Required', type: 'warning', count: 1 };
		}

		if ((project as any).investmentReady === false) {
			return { label: 'Pending Setup', type: 'pending', count: 0 };
		}

		return { label: 'Ready', type: 'success', count: 0 };
	};

	const statusStyles: Record<StatusType, string> = {
		success: 'bg-green-100 text-green-700',
		warning: 'bg-yellow-100 text-yellow-700',
		pending: 'bg-gray-100 text-gray-600',
	};

	const statusIcons: Record<StatusType, string> = {
		success: '✓',
		warning: '!',
		pending: '…',
	};

	const tableColumns: TableColumn<ITransaction>[] = [
		{
			header: 'Name',
			accessor: 'project',
			dataTest: (row) => `investment-item-name-${row.id}`,
			renderCell: (value) => (
				<div className="flex items-center gap-x-2">
					<InitialIcon
						className="bg-primary text-white w-6 h-6"
						word={(value as IProject)?.name ?? 'Project'}
					/>
					{(value as IProject)?.name}
				</div>
			),
			shouldRender: true,
		},
		{
			header: 'Amount',
			accessor: 'amount',
			dataTest: (row) => `investment-item-amount-${row.id}`,
			renderCell: (value) => value as number,
			shouldRender: true,
		},
		{
			header: 'Token',
			accessor: 'id',
			dataTest: (row) => `investment-item-token-${row.id}`,
			renderCell: (_, row) => {
				const project = row.project as IProject;
				return (
					<TokenLink
						assetCode={project?.assetCode || project?.tokenSymbol}
						assetIssuer={project?.assetIssuer || project?.issuer}
						status={project?.status}
						className="hover:underline"
					>
						{project?.tokenSymbol || project?.assetCode || 'TOKEN'}
					</TokenLink>
				);
			},
			shouldRender: true,
		},
		{
			header: 'Type',
			accessor: 'type',
			dataTest: (row) => `investment-item-type-${row.id}`,
			renderCell: (value) =>
				TransactionTypeLabels[
					(value as string).toUpperCase() as keyof typeof TransactionTypeLabels
				],
			shouldRender: true,
		},
		{
			header: 'Status',
			accessor: 'id',
			dataTest: (row) => `investment-item-status-${row.id}`,
			renderCell: (_, row) => {
				const status = getInvestorStatus(row);

				return (
					<div
						className="cursor-pointer"
						onClick={() =>
							navigate(`/project/${(row.project as IProject)?.id}`)
						}
					>
						<span
							className={`px-3 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-2 ${
								statusStyles[status.type]
							}`}
						>
							<span className="text-xs">{statusIcons[status.type]}</span>
							{status.label}
							{status.count > 0 && ` (${status.count})`}
						</span>
					</div>
				);
			},
			shouldRender: true,
		},
		{
			header: 'Created At',
			accessor: 'createdAt',
			dataTest: (row) => `investment-item-created-at-${row.id}`,
			renderCell: (value) => new Date(value as string).toLocaleDateString(),
			shouldRender: true,
		},
		{
			header: 'Actions',
			accessor: 'id',
			dataTest: (row) => `investment-item-actions-${row.id}`,
			renderCell: (_, row) => (
				<Button
					type="button"
					dataTest="investment-item-view"
					className="text-custom-dark-blue px-4 py-1 rounded-full w-[120px] justify-center"
					onClick={() => navigate(`/project/${(row.project as IProject)?.id}`)}
				>
					View
				</Button>
			),
			shouldRender: true,
		},
	];

	return (
		<div className="max-h-[16rem] overflow-auto w-full">
			<Table
				columns={tableColumns}
				data={investments}
				{...dashboardCardTableStyles}
				dataTest="dashboard-investment"
			/>
		</div>
	);
};

export default DashboardInvestmentsCardTable;
