import { ISelectInputValue } from '@/interfaces/common/ISelectInputValue';

interface IMapLabelsToInputItems {
	labels: Record<string, string>;
	keyAsValue?: boolean;
}

export const mapLabelsToInputItems = ({
	labels,
	keyAsValue = false,
}: IMapLabelsToInputItems): ISelectInputValue[] => {
	const items = Object.entries(labels).map(([key, value]) => ({
		name: value,
		value: keyAsValue ? key : value,
	}));

	return items as ISelectInputValue[];
};
