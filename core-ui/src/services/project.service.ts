import { axiosService } from '@/configs/axios';
import {
	normalizeProject,
	normalizeProjectList,
} from '@/utils/projects/normalize-project';

type AnyResponse = any;

const resolveProjectId = (id: string | number): string => {
	const normalized = String(id ?? '').trim();
	if (!normalized) {
		throw new Error(`Invalid project id: ${id}`);
	}
	return normalized;
};

export const projectService = {
	async getProjects(): Promise<AnyResponse> {
		const response = await axiosService.get<AnyResponse>('/project');
		return normalizeProjectList(response);
	},

	async getProjectList(): Promise<AnyResponse> {
		const response = await axiosService.get<AnyResponse>('/project');
		return normalizeProjectList(response);
	},

	async getMyProjects(): Promise<AnyResponse> {
		const response = await axiosService.get<AnyResponse>('/project/my');
		return normalizeProjectList(response);
	},

	// Public read only route for investor/public viewing only
	async getPublicProject(id: string | number): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.get<AnyResponse>(
			`/project/public/${id}`,
		);
		return normalizeProject(response);
	},

	// Private authenticated route for developer/admin editing
	async getProject(id: string | number): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.get<AnyResponse>(`/project/${id}`);
		return normalizeProject(response);
	},

	async getAdminProjects(): Promise<AnyResponse> {
		const response = await axiosService.get<AnyResponse>('/project/admin');
		return normalizeProjectList(response);
	},

	async getProjectInvestors(id: string | number): Promise<any> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		return axiosService.get(`/project/${id}/investors`);
	},

	async createProject(data: any): Promise<AnyResponse> {
		const response = await axiosService.post<AnyResponse, any>(
			'/project',
			data,
		);
		return normalizeProject(response);
	},

	async updateProject(id: string | number, data: any): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.patch<AnyResponse, any>(
			`/project/${id}`,
			data,
		);
		return normalizeProject(response);
	},

	async uploadProjectFile(
		id: string | number,
		file: File,
		purpose: string,
		documentKey?: string,
	): Promise<any> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const formData = new FormData();
		formData.append('file', file);
		formData.append('purpose', purpose);
		if (documentKey) {
			formData.append('documentKey', documentKey);
		}

		const response = await axiosService.post<any, any>(
			`/project/${id}/assets`,
			formData,
			{},
		);

		return response;
	},

	// Draft save should use the private project update route unless backend has a separate private /draft route
	async saveDraft(id: string | number, data: any): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.patch<AnyResponse, any>(
			`/project/${id}/draft`,
			data,
		);
		return normalizeProject(response);
	},

	async submitProject(id: string | number): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.post<AnyResponse, any>(
			`/project/${id}/submit`,
			{},
		);
		return normalizeProject(response);
	},

	async approveProject(
		id: string | number,
		adminNotes?: string,
	): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.post<AnyResponse, any>(
			`/project/${id}/approve`,
			{
				adminNotes,
			},
		);
		return normalizeProject(response);
	},

	async requestRevision(
		id: string | number,
		adminNotes?: string,
	): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.post<AnyResponse, any>(
			`/project/${id}/request-revision`,
			{
				adminNotes,
			},
		);
		return normalizeProject(response);
	},

	async rejectProject(
		id: string | number,
		adminNotes?: string,
	): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.post<AnyResponse, any>(
			`/project/${id}/reject`,
			{
				adminNotes,
			},
		);
		return normalizeProject(response);
	},

	async issueProject(
		id: string | number,
		adminNotes?: string,
	): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.post<AnyResponse, any>(
			`/project/${id}/issue`,
			{
				adminNotes,
			},
		);
		return normalizeProject(response);
	},

	async goLive(id: string | number): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.post<AnyResponse, any>(
			`/project/${id}/live`,
			{},
		);
		return normalizeProject(response);
	},

	async lockProject(
		id: string | number,
		reason?: string,
	): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.post<AnyResponse, any>(
			`/project/${id}/lock`,
			{
				reason,
			},
		);
		return normalizeProject(response);
	},

	async deleteProject(id: string | number): Promise<AnyResponse> {
		if (!id || Number.isNaN(Number(id))) {
			throw new Error(`Invalid project id: ${id}`);
		}

		const response = await axiosService.post<AnyResponse, any>(
			`/project/${id}/delete`,
			{},
		);
		return normalizeProject(response);
	},

	async prepareProjectForIssuance(
		id: string | number,
		reason?: string,
	): Promise<AnyResponse> {
		return axiosService.post(
			`/project/${resolveProjectId(id)}/prepare-issuance`,
			{ reason },
		);
	},

	async getReadiness(id: string | number): Promise<AnyResponse> {
		return axiosService.get(`/project/${resolveProjectId(id)}/readiness`);
	},

	async getRpaSummary(id: string | number): Promise<AnyResponse> {
		return axiosService.get(`/project/${resolveProjectId(id)}/rpa-summary`);
	},

	async saveReadinessSection(
		id: string | number,
		section: string,
		data: Record<string, unknown>,
	): Promise<AnyResponse> {
		return axiosService.patch(
			`/project/${resolveProjectId(id)}/readiness/${section}`,
			data,
		);
	},

	async calculateReadinessReturns(id: string | number): Promise<AnyResponse> {
		return axiosService.post(
			`/project/${resolveProjectId(id)}/readiness/return-outputs/calculate`,
			{},
		);
	},
};
