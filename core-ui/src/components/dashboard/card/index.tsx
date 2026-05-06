import React from 'react';

import DashboardCardHeader from '../card-header';

import Loader from '@/components/common/loader';
import { IDashboardCardHeaderActionProps } from '@/interfaces/dashboard/IDashboardCardHeaderAction';

interface IDashboardCardProps {
	title: string;
	cardAction?: IDashboardCardHeaderActionProps;
	children: React.ReactNode;
	isLoading?: boolean;
	emptyOptions?: { isEmpty: boolean; title: string };
	cardId: string;
}

const DashboardCard: React.FC<IDashboardCardProps> = ({
	title,
	children,
	isLoading = false,
	emptyOptions,
	cardId,
	cardAction,
}) => {
	return (
		<div className="w-full" data-test={`dashboard-card-${cardId}`}>
			<div className="theme-surface relative flex h-full flex-col rounded-xl shadow-md">
				<DashboardCardHeader title={title} action={cardAction} />
				<div className="flex p-[1.24rem] pt-1">
					{isLoading ? (
						<div className="flex w-full items-center justify-center pt-10">
							<Loader />
						</div>
					) : emptyOptions?.isEmpty ? (
						<div className="w-full flex items-center justify-center h-[10rem]">
							<span
								className="theme-text-secondary text-center font-semibold"
								data-test={`dashboard-card-empty-${cardId}`}
							>
								{emptyOptions.title}
							</span>
						</div>
					) : (
						children
					)}
				</div>
			</div>
		</div>
	);
};

export default DashboardCard;
