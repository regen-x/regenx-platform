import { IGroupedMenuItem } from '@/interfaces/layout/IGroupedMenuItem';
import { IMenuItem } from '@/interfaces/layout/IMenuItem';

export const groupMenuItems = (
	groupedMenuItems: IGroupedMenuItem[],
	item: IMenuItem,
) => {
	const title = item.group ?? item.menuTitle;
	const existingGroup = groupedMenuItems.find((group) => group.title === title);

	if (existingGroup) {
		existingGroup.items.push(item);
	} else {
		groupedMenuItems.push({ title, items: [item] });
	}

	return groupedMenuItems;
};
