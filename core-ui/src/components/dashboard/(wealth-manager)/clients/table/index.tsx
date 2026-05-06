import Button from '@/components/common/button';
import InitialIcon from '@/components/common/initial-icon';
import Table, { TableColumn } from '@/components/common/table';
import { dashboardCardTableStyles } from '@/constants/dashboard/card-table-styles';
import { IUser } from '@/interfaces/api/IUser';

interface IDashboardClientsCardTableProps {
	clients: IUser[];
	selectedClientPublicKey?: string;
	onClientSelect: (walletAddress: string) => void;
}

const DashboardClientsCardTable: React.FC<IDashboardClientsCardTableProps> = ({
	clients,
	selectedClientPublicKey,
	onClientSelect,
}: IDashboardClientsCardTableProps) => {
	const tableColumns: TableColumn<IUser>[] = [
		{
			header: 'Name',
			accessor: 'fullName',
			dataTest: (row) => `client-item-name-${row.id}`,
			renderCell: (value) => (
				<div className="flex items-center gap-x-2">
					<InitialIcon
						className="bg-primary text-white w-6 h-6"
						word={value as string}
					/>{' '}
					{value as string}
				</div>
			),
			shouldRender: true,
		},
		{
			header: 'Properties',
			accessor: 'walletAddress',
			dataTest: (row) => `client-item-properties-${row.id}`,
			renderCell: (value) => (
				<Button
					type="button"
					className="text-custom-dark-blue mt-0 px-4 py-1 min-w-fit rounded-full"
					dataTest="client-item-select"
					onClick={() => onClientSelect(value as string)}
					disabled={selectedClientPublicKey === value}
				>
					{selectedClientPublicKey === value ? 'Selected' : 'Select client'}
				</Button>
			),
			shouldRender: true,
		},
	];

	return (
		<div className="max-h-[16rem] overflow-auto w-full">
			<Table
				columns={tableColumns}
				data={clients}
				{...dashboardCardTableStyles}
				dataTest="dashboard-clients"
			/>
		</div>
	);
};

export default DashboardClientsCardTable;
