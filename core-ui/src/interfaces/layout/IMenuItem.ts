export interface IMenuItem {
	menuTitle: string;
	path: string;
	icon: JSX.Element;
	active: boolean;
	selected: boolean;
	title: string;
	dataTest: string;
	group?: string;
	role?: string;
	key?: string;
	requiresKybApproval?: boolean;
}
