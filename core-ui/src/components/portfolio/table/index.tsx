import { useNavigate } from 'react-router-dom';

import TokenLink from '@/components/common/TokenLink';
import Button from '@/components/common/button';
import InitialIcon from '@/components/common/initial-icon';
import Table, { TableColumn } from '@/components/common/table';
import { SOROBAN_TOKEN_EXPONENT } from '@/constants/common/stellar';
import { dashboardCardTableStyles } from '@/constants/dashboard/card-table-styles';
import { IProject } from '@/interfaces/api/IProject';

interface IPortfolioTableProps {
	projects: IProject[];
	projectBalances: Record<string, number>;
}

type StatusType = 'success' | 'warning' | 'pending';

interface IInvestorStatus {
	label: string;
	type: StatusType;
	count: number;
}

const PortfolioTable: React.FC<IPortfolioTableProps> = ({
	projects,
}: IPortfolioTableProps) => {
	const navigate = useNavigate();

	const getInvestorStatus = (project: IProject): IInvestorStatus => {
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

	const tableColumns: TableColumn<IProject>[] = [
		{
			header: 'Name',
			accessor: 'name',
			dataTest: (row) => `portfolio-item-name-${row.id}`,
			renderCell: (value) => (
				<div className="flex items-center gap-x-2">
					<InitialIcon
						className="bg-primary text-white w-6 h-6"
						word={value as string}
					/>
					{value as string}
				</div>
			),
			shouldRender: true,
		},
		{
			header: 'Symbol',
			accessor: 'tokenSymbol',
			dataTest: (row) => `portfolio-item-symbol-${row.id}`,
			renderCell: (value, row) => (
				<TokenLink
					assetCode={row.assetCode || (value as string)}
					assetIssuer={row.assetIssuer || row.issuer}
					status={row.status}
					className="hover:underline"
				>
					{(value as string) || row.assetCode || 'TOKEN'}
				</TokenLink>
			),
			shouldRender: true,
		},
		{
			header: 'Token Price',
			accessor: 'tokenPrice',
			dataTest: (row) => `portfolio-item-price-${row.id}`,
			renderCell: (value) =>
				`$${(Number(value ?? 0) / SOROBAN_TOKEN_EXPONENT).toLocaleString()}`,
			shouldRender: true,
		},
		{
			header: 'Purchased',
			accessor: 'purchasedAmount',
			dataTest: (row) => `portfolio-item-purchased-${row.id}`,
			renderCell: (value) =>
				(Number(value ?? 0) / SOROBAN_TOKEN_EXPONENT).toLocaleString(),
			shouldRender: true,
		},
		{
			header: 'Invested',
			accessor: 'id',
			dataTest: (row) => `portfolio-item-invested-${row.id}`,
			renderCell: (_, row) => {
				const purchased =
					Number(row.purchasedAmount ?? 0) / SOROBAN_TOKEN_EXPONENT;
				const tokenPrice = 1;
				const invested = purchased * tokenPrice;

				return `$${invested.toLocaleString()}`;
			},
			shouldRender: true,
		},
		{
			header: 'Status',
			accessor: 'id',
			dataTest: (row) => `portfolio-item-status-${row.id}`,
			renderCell: (_, row) => {
				const status = getInvestorStatus(row);

				return (
					<div
						className="cursor-pointer"
						onClick={() => navigate(`/project/${row.id}`)}
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
			header: 'Actions',
			accessor: 'id',
			dataTest: (row) => `portfolio-item-actions-${row.id}`,
			renderCell: (id) => (
				<Button
					type="button"
					dataTest="portfolio-item-view"
					className="text-custom-dark-blue px-4 py-1 rounded-full w-[120px] justify-center"
					onClick={() => navigate(`/project/${id}`)}
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
				data={projects ?? []}
				{...dashboardCardTableStyles}
				dataTest="portfolio-table"
			/>
		</div>
	);
};

export default PortfolioTable;
