import { UserType, UserTypeLabels } from '@/constants/enum/user-type.enum';

const userTypeLabelsMap: Record<UserType, string> = {
	[UserType.ADMIN]: UserTypeLabels.ADMIN,
	[UserType.CLIMATE_DEVELOPER]: UserTypeLabels.CLIMATE_DEVELOPER,
	[UserType.WHOLESALE_INVESTOR]: UserTypeLabels.WHOLESALE_INVESTOR,
	[UserType.WEALTH_MANAGER]: UserTypeLabels.WEALTH_MANAGER,
};

export const getUserTypeLabel = (type: UserType) =>
	userTypeLabelsMap[type] || '';
