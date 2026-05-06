import { UserTypeLabels } from '../enum/user-type.enum';

import { mapLabelsToInputItems } from '@/utils/map-labels-to-input-items';

export const SIGN_UP_USER_TYPE_SELECT_ITEMS = mapLabelsToInputItems({
	labels: UserTypeLabels,
	keyAsValue: true,
});
