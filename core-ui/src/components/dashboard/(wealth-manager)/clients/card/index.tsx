import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import DashboardClientsCardTable from '../table';

import DashboardCard from '@/components/dashboard/card';
import { UserType } from '@/constants/enum/user-type.enum';
import { PATHS } from '@/constants/routes/paths';
import { IUser } from '@/interfaces/api/IUser';
import { notificationService } from '@/services/notification.service';
import { userService } from '@/services/user.service';
import {
	setSelectedClientPublicKey,
	useStellarStore,
} from '@/store/stellar.store';
import { useUserStore } from '@/store/user.store';

const DashboardClientsCard: React.FC = () => {
	const { user } = useUserStore();
	const { selectedClientPublicKey } = useStellarStore();
	const [userClients, setUserClients] = useState<IUser[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const getUserClients = useCallback(async () => {
		try {
			if (!user || user.type !== UserType.WEALTH_MANAGER) {
				return;
			}

			setIsLoading(true);
			const clients = await userService.getUserList({
				walletManagerUuid: user?.id,
			});

			const formattedClients = clients.data.map(({ attributes, id }) => ({
				...attributes,
				id,
			}));
			setUserClients(formattedClients);
		} catch (error) {
			console.error(error);
			notificationService.error(
				'An error occurred while fetching user clients',
			);
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	const handleSelectClient = (walletAddress: string) => {
		setSelectedClientPublicKey(walletAddress);
		notificationService.success('Client selected successfully');
	};

	useEffect(() => {
		getUserClients();
	}, [getUserClients]);

	return (
		<DashboardCard
			title="Client list"
			isLoading={isLoading}
			emptyOptions={{
				isEmpty: !(userClients ?? []).length,
				title: "We couldn't find any clients",
			}}
			cardId="user-clients"
		>
			<div className="flex flex-col w-full bg-white rounded-xl">
				{user?.walletAddress ? (
					<DashboardClientsCardTable
						onClientSelect={handleSelectClient}
						clients={userClients}
						selectedClientPublicKey={selectedClientPublicKey}
					/>
				) : (
					<div className="flex w-full my-4" data-test="connect-wallet-message">
						Please{' '}
						<Link
							className="inline mx-1 text-primary font-semibold"
							to={PATHS.CASH_ACCOUNT}
						>
							connect your wallet
						</Link>{' '}
						to start adding clients
					</div>
				)}
			</div>
		</DashboardCard>
	);
};

export default DashboardClientsCard;
