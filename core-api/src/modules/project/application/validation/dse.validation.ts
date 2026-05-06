import { BadRequestException } from '@nestjs/common';
import { DseType } from '../../domain/dse-type.enum';

type AnyObject = Record<string, any>;

export function normalizeDseType(value?: unknown): DseType {
	const raw = String(value || '').trim().toLowerCase();

	if (raw.includes('operating')) return DseType.Operating;
	if (raw.includes('construction')) return DseType.Construction;
	return DseType.Development;
}

export function validateDseState(input: {
	dseType?: unknown;
	project?: AnyObject;
	payload?: AnyObject;
}) {
	const dseType = normalizeDseType(input.dseType);
	const project = input.project || {};
	const payload = input.payload || {};

	const stage = String(project.stage || payload.stage || '').toLowerCase();

	const revenueModel = project.revenueModel || payload.revenueModel || {};
	const agreementType = String(revenueModel.agreementType || '').trim();

	const financialClose =
		project.financialCloseAchieved ??
		payload.financialCloseAchieved ??
		null;

	const gridConnected =
		project.gridConnected ??
		payload.gridConnected ??
		false;

	const commissioned =
		project.commissioned ??
		payload.commissioned ??
		false;

	const installed =
		project.installed ??
		payload.installed ??
		false;

	const isOperatingSignal =
		gridConnected ||
		commissioned ||
		installed ||
		stage.includes('operating') ||
		stage.includes('live');

	const hasRevenueSignal = Boolean(
		agreementType ||
		revenueModel.primaryCounterparty ||
		revenueModel.paymentFrequency ||
		revenueModel.revenueModelType,
	);

	if (dseType === DseType.Development && isOperatingSignal) {
		throw new BadRequestException(
			'Development projects cannot include operating signals such as grid-connected or live status.',
		);
	}

	if (dseType === DseType.Construction && financialClose === false) {
		throw new BadRequestException(
			'Construction projects cannot be marked with financial close explicitly set to false.',
		);
	}

	if (dseType === DseType.Operating) {
		if (!isOperatingSignal && !hasRevenueSignal) {
			throw new BadRequestException(
				'Operating projects must include at least one operational signal or revenue signal.',
			);
		}
	}

	return dseType;
}
