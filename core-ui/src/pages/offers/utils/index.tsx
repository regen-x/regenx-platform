import { UserType } from '@/constants/enum/user-type.enum';
import { IOffer, IOfferFilterOptions } from '@/interfaces/api/IOffer';
import { IProject } from '@/interfaces/api/IProject';
import { IUser } from '@/interfaces/api/IUser';
import { notificationService } from '@/services/notification.service';
import { offerService } from '@/services/offer.service';
import { projectService } from '@/services/project.service';

export const getOffers = async (
	setIsLoading: (isLoading: boolean) => void,
	setOffers: React.Dispatch<React.SetStateAction<IOffer[]>>,
	setHasMore: (hasMore: boolean) => void,
	currentFilters?: IOfferFilterOptions,
	newPage = 1,
	user?: IUser | null,
	selectedClientPublicKey?: string | null,
	options?: IOfferFilterOptions,
) => {
	try {
		if (!user) {
			return;
		}

		if (user.type === UserType.WEALTH_MANAGER && !selectedClientPublicKey) {
			notificationService.error('Please select a client');
			return;
		}

		setIsLoading(true);
		const {
			data: offers,
			meta: { pageNumber, pageCount },
		} = await offerService.getOfferList({
			...currentFilters,
			...options,
			page: newPage,
		});

		const offersData = offers.map(({ attributes, id }: any) => ({
			...attributes,
			id,
		}));

		setOffers((prev: IOffer[]) =>
			newPage === 1 ? offersData : [...prev, ...offersData],
		);
		setHasMore(pageNumber < pageCount);
	} catch (error) {
		console.error(error);
		notificationService.error('An error occurred while fetching offers');
	} finally {
		setIsLoading(false);
	}
};

export const getProjects = async (
	setProjects: React.Dispatch<React.SetStateAction<IProject[]>>,
) => {
	const { data: projects } = await projectService.getProjectList();

	const projectsData = projects.map(({ attributes, id }: any) => ({
		...attributes,
		id,
	}));
	setProjects(projectsData);
};

export const handleResetPagination = (
	setOffers: React.Dispatch<React.SetStateAction<IOffer[]>>,
	setPageNumber: React.Dispatch<React.SetStateAction<number>>,
	setHasMore: React.Dispatch<React.SetStateAction<boolean>>,
) => {
	setOffers([]);
	setPageNumber(1);
	setHasMore(true);
};
