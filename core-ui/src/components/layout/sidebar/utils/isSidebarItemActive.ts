import { Location } from 'react-router-dom';

import { IMenuItem } from '@/interfaces/layout/IMenuItem';

export const isSidebarItemActive = (item: IMenuItem, location: Location) => {
	const regex = new RegExp(`^.*${item.path}/{0,1}$`);
	return regex.test(location.pathname);
};
