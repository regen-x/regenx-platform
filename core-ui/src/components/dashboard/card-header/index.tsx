import React from 'react';

import { IDashboardCardHeaderActionProps } from '@/interfaces/dashboard/IDashboardCardHeaderAction';

interface IDashboardCardHeaderProps {
	title: string;
	action?: IDashboardCardHeaderActionProps;
	dataTest?: string;
}

const DashboardCardHeader: React.FC<IDashboardCardHeaderProps> = ({
	title,
	action,
}) => {
	return (
		<div className="theme-border mb-0 flex w-full items-center justify-between border-b px-5 pb-4 pt-5">
			<div className="theme-heading mb-0 text-lg font-semibold">{title}</div>
			{action && (
				<button
					className="font-semibold theme-text-secondary"
					onClick={action.onClick}
					data-test={action.dataTest}
				>
					{action.title}
				</button>
			)}
		</div>
	);
};

export default DashboardCardHeader;
