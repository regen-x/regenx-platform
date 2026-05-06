import { useState } from 'react';

import BaseModal from '../base-modal';

import Button from '@/components/common/button';
import InitialIcon from '@/components/common/initial-icon';
import Table, { TableColumn } from '@/components/common/table';
import { dashboardCardTableStyles } from '@/constants/dashboard/card-table-styles';
import { IUser } from '@/interfaces/api/IUser';

interface IAddWalletManagerModalProps {
	isOpen: boolean;
	isLoading?: boolean;
	showCloseButtons?: boolean;
	managerList: IUser[];
	fetchManagers: (nameSearch?: string) => Promise<void>;
	onManagerSelect: (managerUuid: string) => Promise<void>;
	closeModal: () => void;
}

const AddWalletManagerModal = ({
	isOpen,
	isLoading,
	showCloseButtons,
	managerList,
	fetchManagers,
	onManagerSelect,
	closeModal,
}: IAddWalletManagerModalProps) => {
	const [nameSearch, setNameSearch] = useState<string>('');

	const tableColumns: TableColumn<IUser>[] = [
		{
			header: 'Name',
			accessor: 'fullName',
			dataTest: (row) => `wallet-manager-item-name-${row.id}`,
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
			accessor: 'id',
			dataTest: (row) => `wallet-manager-item-properties-${row.id}`,
			renderCell: (value) => (
				<Button
					type="button"
					className="text-custom-dark-blue mt-0 px-4 py-1 min-w-fit rounded-full"
					dataTest="wallet-manager-item-add"
					onClick={() => onManagerSelect(value as string)}
				>
					Add manager
				</Button>
			),
			shouldRender: true,
		},
	];

	return (
		<BaseModal
			title="Select Wealth Manager"
			showCloseButtons={showCloseButtons}
			showFooter={false}
			isOpen={isOpen}
			closeModal={closeModal}
			dataTest="add-wallet-manager-modal"
		>
			<div>
				<div className="flex gap-4 border-b pb-3 items-center">
					<div className="flex flex-col">
						<label htmlFor="name" className="font-semibold mb-2">
							Manager name
						</label>
						<input
							type="text"
							className="border-[1px] border-gray-400 rounded-md px-5 py-2 text-sm focus:border-blue-500 outline-none focus:shadow-blue-500/30 focus:shadow-outline data-[error=true]:border-red-500"
							id="name"
							name="name"
							placeholder="Name"
							value={nameSearch}
							data-test="wallet-manager-search"
							onChange={(e) => setNameSearch(e.target.value)}
						/>
					</div>
					<Button
						type="button"
						className="h-fit text-white"
						dataTest="wallet-manager-search-button"
						onClick={() => fetchManagers(nameSearch)}
						isLoading={isLoading}
					>
						Search
					</Button>
				</div>
				<div>
					<Table
						data={managerList}
						columns={tableColumns}
						dataTest="wallet-manager-table"
						{...dashboardCardTableStyles}
					/>
				</div>
			</div>
		</BaseModal>
	);
};

export default AddWalletManagerModal;
