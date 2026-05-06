export type OrderStatus =
	| 'DRAFT'
	| 'PENDING_SIGNATURE'
	| 'SUBMITTED'
	| 'SETTLING'
	| 'COMPLETED'
	| 'FAILED'
	| 'CANCELLED';

export type OrderType = 'BUY' | 'SELL';

export interface IOrderTimelineEntry {
	status: OrderStatus;
	label: string;
	timestamp?: string | null;
	reached: boolean;
	current: boolean;
}

export interface IOrderResultingTransaction {
	id: number;
	reference?: string | null;
	amount: number;
	tokenAmount?: number | null;
	status: string;
	createdAt: string;
}

export interface IOrder {
	id: number;
	uuid?: string;
	userId: number;
	projectId: number;
	projectName: string;
	tokenSymbol: string;
	orderType: OrderType;
	currencyAmount: number;
	tokenAmount: number;
	status: OrderStatus;
	failureReason?: string | null;
	txHash?: string | null;
	reference?: string | null;
	createdAt: string;
	updatedAt: string;
	settledAt?: string | null;
	resultingTransactionId?: number | null;
	canRetry?: boolean;
	canCancel?: boolean;
	timeline?: IOrderTimelineEntry[];
	resultingTransaction?: IOrderResultingTransaction | null;
}

export interface IOrderSummary {
	pendingCount: number;
	settlingCount: number;
	completedCount: number;
	failedCount: number;
	recent?: IOrder[];
}
