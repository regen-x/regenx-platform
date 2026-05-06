import { IReactChildrenProps } from '@/interfaces/IReactChildren';

export default function AuthTitle({ children }: IReactChildrenProps) {
	return <h1 className="text-2xl font-bold font-sans pb-4">{children}</h1>;
}
