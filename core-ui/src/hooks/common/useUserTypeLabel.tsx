import { useMemo } from 'react';

import { UserType } from '@/constants/enum/user-type.enum';
import { getUserTypeLabel } from '@/utils/get-user-type-labels';

interface IUseUserTypeLabelProps {
	userType?: UserType;
}

const useUserTypeLabel = ({ userType }: IUseUserTypeLabelProps) => {
	const userTypeLabel = useMemo(() => {
		let typeLabel;

		if (userType) {
			typeLabel = getUserTypeLabel(userType);
		}

		return typeLabel;
	}, [userType]);

	return {
		userTypeLabel,
	};
};

export default useUserTypeLabel;
