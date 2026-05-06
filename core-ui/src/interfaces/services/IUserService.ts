import { ISingleResponse } from '../api/IApiBaseResponse';
import { IUser } from '../api/IUser';

export interface IUserService {
	getCurrentUser(): Promise<ISingleResponse<IUser>>;
}
