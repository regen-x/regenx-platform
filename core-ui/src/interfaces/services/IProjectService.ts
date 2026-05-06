import { IListResponse, ISingleResponse } from '../api/IApiBaseResponse';
import { IProject } from '../api/IProject';

export interface ICreateProject {
	name?: string;
	description?: string;
	location?: string;
	fundingGoal?: number;
	fundedSoFar?: number;
	startDate?: string;
	endDate?: string;
	climateImpact?: string;
	tokenSupply?: number;
	tokenPrice?: number;
	tokenSymbol?: string;
	ownerAddress?: string;
	generatesCarbonCredits?: boolean;
	thumbnailUrl?: string;
	projectType?: string;
	dseType?: string;
	stage?: string;
	jurisdiction?: string;
	minimumInvestment?: string;
	totalProjectCapex?: string;
	targetIrr?: string;
	targetAnnualYield?: string;
	investmentTermYears?: string;
	investmentSummary?: string;
	payloadJson?: Record<string, unknown>;
	workflowStatusJson?: Record<string, unknown>;
	completedCount?: number;
	totalSections?: number;
	adminNotes?: string;
	agreementAccepted?: boolean;
	agreementAcceptedAt?: string;
	agreementVersion?: string;
	status?: string;
}

export interface IGetProjectList {
	page?: number;
	userUuid?: string;
}

export type IUpdateProject = Partial<ICreateProject>;

export interface IProjectService {
	getProjectList(config?: IGetProjectList): Promise<IListResponse<IProject>>;
	getProject(id: string): Promise<ISingleResponse<IProject>>;
	createProject(project: ICreateProject): Promise<ISingleResponse<IProject>>;
	updateProject(
		id: string,
		project: IUpdateProject,
	): Promise<ISingleResponse<IProject>>;
	submitProject(id: string): Promise<ISingleResponse<IProject>>;
	approveProject(
		id: string,
		adminNotes?: string,
	): Promise<ISingleResponse<IProject>>;
	requestRevision(
		id: string,
		adminNotes?: string,
	): Promise<ISingleResponse<IProject>>;
	issueProject(
		id: string,
		adminNotes?: string,
	): Promise<ISingleResponse<IProject>>;
	goLive(id: string): Promise<ISingleResponse<IProject>>;
	lockProject(id: string, reason?: string): Promise<ISingleResponse<IProject>>;
}
