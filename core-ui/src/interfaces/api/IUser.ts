import { IBase } from './IBase';

import { UserType } from '@/constants/enum/user-type.enum';

export interface IUser extends IBase {
	email: string;
	fullName: string;
	birthDate: string;
	phoneNumber: number;
	type: UserType;
	externalId?: string;
	walletAddress?: string;
	investors?: IUser[];
	walletManager?: string;
}
