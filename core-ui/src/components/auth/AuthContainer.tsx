import { IReactChildrenProps } from '@/interfaces/IReactChildren';

export default function AuthContainer({ children }: IReactChildrenProps) {
	return <div className="my-8 p-10 px-8">{children}</div>;
}
