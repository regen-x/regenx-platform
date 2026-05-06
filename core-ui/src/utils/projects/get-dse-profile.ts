export type DSEType = 'ODSE' | 'DDSE' | 'HDSE';

export const getDseTypeFromProject = (project: {
	dseType?: string;
	name?: string;
	projectType?: string;
	description?: string;
}): DSEType => {
	if (project?.dseType && ['ODSE', 'DDSE', 'HDSE'].includes(project.dseType)) {
		return project.dseType as DSEType;
	}

	const combined = `${project?.name || ''} ${project?.projectType || ''} ${
		project?.description || ''
	}`.toLowerCase();

	if (
		combined.includes('development') ||
		combined.includes('construction') ||
		combined.includes('pre-operational') ||
		combined.includes('pre operational')
	) {
		return 'DDSE';
	}

	if (
		combined.includes('hybrid') ||
		combined.includes('solar + battery') ||
		combined.includes('solar and battery') ||
		combined.includes('battery + solar') ||
		combined.includes('battery and solar') ||
		combined.includes('upgrade') ||
		combined.includes('expansion')
	) {
		return 'HDSE';
	}

	return 'ODSE';
};

export const getDseMeta = (dseType: DSEType) => {
	if (dseType === 'DDSE') {
		return {
			sectorLabel: 'Development Asset',
			structureLabel: 'SPV / project docs',
			cashflowLabel: 'Milestone based',
			yieldLabel: 'Higher risk profile',
		};
	}

	if (dseType === 'HDSE') {
		return {
			sectorLabel: 'Hybrid Energy',
			structureLabel: 'Blended structure',
			cashflowLabel: 'Mixed cashflows',
			yieldLabel: 'Balanced profile',
		};
	}

	return {
		sectorLabel: 'Operating Asset',
		structureLabel: 'SPV / trust linked',
		cashflowLabel: 'Operating cashflows',
		yieldLabel: 'Yield focused',
	};
};
