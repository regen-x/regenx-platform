import { IBase } from './IBase';
import { IProject } from './IProject';
import { IUser } from './IUser';

import {
	TransactionStatus,
	TransactionType,
} from '@/constants/enum/transaction-type.enum';

export interface ITransaction extends IBase {
	user?: IUser;
	project?: IProject;
	amount: number;
	currency: string;
	tokenAmount?: number;
	type: TransactionType;
	status: TransactionStatus;
	reference?: string;
	description?: string;
	settledAt?: string;
}
