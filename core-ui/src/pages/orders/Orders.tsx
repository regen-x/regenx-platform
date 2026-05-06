import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
	AdminActionButton,
	AdminDataTableShell,
	AdminFilterBar,
	AdminPageHeader,
	AdminStatCard,
	AdminStatusBadge,
} from '@/components/admin-ui';
import { IOrder } from '@/interfaces/api/IOrder';
import { orderService } from '@/services/order.service';

const money = (value?: number | null, currency = 'AUD') =>
	value == null || Number.isNaN(Number(value))
		? '—'
		: new Intl.NumberFormat('en-AU', {
				style: 'currency',
				currency,
				maximumFractionDigits: 2,
		  }).format(Number(value));

const formatTokenAmount = (value?: number | null) =>
	value == null || Number.isNaN(Number(value))
		? '—'
		: Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });

const statusTone = (status: string) => {
	if (status === 'COMPLETED') return 'blue' as const;
	if (status === 'FAILED') return 'pink' as const;
	if (status === 'DRAFT' || status === 'CANCELLED') return 'gray' as const;
	return 'yellow' as const;
};

function OrderDetailModal({
	order,
	onClose,
	onOpenTransactions,
}: {
	order: IOrder | null;
	onClose: () => void;
	onOpenTransactions: (reference?: string | null) => void;
}) {
	if (!order) return null;

	return (
		<div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.45)] px-4 py-6">
			<div className="w-full max-w-[760px] rounded-[22px] border border-[#E7ECF4] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
				<div className="flex items-start justify-between gap-4">
					<div>
						<div className="inline-flex rounded-[8px] bg-[#DDEBFF] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#346FB6]">
							Order Detail
						</div>
						<h2 className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-[#163F74]">
							{order.projectName}
						</h2>
						<div className="mt-2 flex flex-wrap items-center gap-2">
							<AdminStatusBadge
								label={order.status}
								tone={statusTone(order.status)}
							/>
							<span className="text-[13px] text-[#66748E]">
								{order.reference || `Order ${order.id}`}
							</span>
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="rounded-[12px] border border-[#E7ECF4] px-4 py-2 text-[13px] font-semibold text-[#5F6C86]"
					>
						Close
					</button>
				</div>

				<div className="mt-5 grid gap-3 md:grid-cols-2">
					<div className="rounded-[16px] border border-[#E7ECF4] bg-[#F9FBFE] p-4">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
							Token Symbol
						</div>
						<div className="mt-2 text-[18px] font-semibold text-[#1B2F56]">
							{order.tokenSymbol}
						</div>
					</div>
					<div className="rounded-[16px] border border-[#E7ECF4] bg-[#F9FBFE] p-4">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
							Capital Committed
						</div>
						<div className="mt-2 text-[18px] font-semibold text-[#1B2F56]">
							{money(order.currencyAmount)}
						</div>
					</div>
					<div className="rounded-[16px] border border-[#E7ECF4] bg-[#F9FBFE] p-4">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
							Tokens Expected
						</div>
						<div className="mt-2 text-[18px] font-semibold text-[#1B2F56]">
							{formatTokenAmount(order.tokenAmount)}
						</div>
					</div>
					<div className="rounded-[16px] border border-[#E7ECF4] bg-[#F9FBFE] p-4">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
							Last Updated
						</div>
						<div className="mt-2 text-[18px] font-semibold text-[#1B2F56]">
							{new Date(order.updatedAt).toLocaleString()}
						</div>
					</div>
				</div>

				<div className="mt-5 rounded-[18px] border border-[#E7ECF4] bg-white p-5">
					<div className="text-[16px] font-semibold text-[#163F74]">
						Status Timeline
					</div>
					<div className="mt-4 space-y-3">
						{(order.timeline || []).map((entry) => (
							<div key={entry.status} className="flex items-start gap-3">
								<div
									className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
										entry.reached ? 'bg-[#2F80ED]' : 'bg-[#D0D5DD]'
									}`}
								/>
								<div className="min-w-0">
									<div className="text-[14px] font-semibold text-[#1B2F56]">
										{entry.label}
									</div>
									<div className="text-[13px] text-[#66748E]">
										{entry.timestamp
											? new Date(entry.timestamp).toLocaleString()
											: entry.current
											? 'Current stage'
											: 'Not reached'}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="mt-5 grid gap-3 md:grid-cols-2">
					<div className="rounded-[16px] border border-[#E7ECF4] bg-[#F9FBFE] p-4">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
							Tx Reference
						</div>
						<div className="mt-2 text-[14px] font-semibold text-[#1B2F56]">
							{order.txHash || order.reference || '—'}
						</div>
					</div>
					<div className="rounded-[16px] border border-[#E7ECF4] bg-[#F9FBFE] p-4">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
							Failure Reason
						</div>
						<div className="mt-2 text-[14px] text-[#1B2F56]">
							{order.failureReason || '—'}
						</div>
					</div>
				</div>

				{order.resultingTransaction || order.txHash ? (
					<div className="mt-5 flex justify-end">
						<button
							type="button"
							onClick={() =>
								onOpenTransactions(
									order.resultingTransaction?.reference ||
										order.txHash ||
										order.reference,
								)
							}
							className="rounded-[12px] border border-[#2F80ED] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#2F80ED]"
						>
							View Resulting Transaction
						</button>
					</div>
				) : null}
			</div>
		</div>
	);
}

export default function Orders() {
	const navigate = useNavigate();
	const [orders, setOrders] = useState<IOrder[]>([]);
	const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
	const [summary, setSummary] = useState({
		pendingCount: 0,
		settlingCount: 0,
		completedCount: 0,
		failedCount: 0,
	});
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState('');
	const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

	const load = async () => {
		try {
			setLoading(true);
			const [orderRows, orderSummary] = await Promise.all([
				orderService.getMyOrders(),
				orderService.getMySummary(),
			]);
			setOrders(Array.isArray(orderRows) ? orderRows : []);
			setSummary({
				pendingCount: Number(orderSummary?.pendingCount ?? 0),
				settlingCount: Number(orderSummary?.settlingCount ?? 0),
				completedCount: Number(orderSummary?.completedCount ?? 0),
				failedCount: Number(orderSummary?.failedCount ?? 0),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void load();
	}, []);

	const visibleOrders = useMemo(() => {
		if (!status) return orders;
		return orders.filter((order) => order.status === status);
	}, [orders, status]);

	const openDetail = async (orderId: number) => {
		const detail = await orderService.getOrder(orderId);
		setSelectedOrder(detail || null);
	};

	const cancelOrder = async (orderId: number) => {
		try {
			setBusyOrderId(orderId);
			await orderService.cancelOrder(orderId);
			await load();
			if (selectedOrder?.id === orderId) {
				const detail = await orderService.getOrder(orderId);
				setSelectedOrder(detail || null);
			}
		} finally {
			setBusyOrderId(null);
		}
	};

	return (
		<div className="theme-page-shell min-h-screen px-4 py-4">
			<div className="w-full max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Investor Portal"
					title="Orders"
					description="Follow every post-investment lifecycle stage from pending signature through settlement, completion, failure, or cancellation."
					actions={
						<div className="flex gap-3">
							<AdminActionButton disabled>Export CSV</AdminActionButton>
							<AdminActionButton disabled tone="secondary">
								Order Statements
							</AdminActionButton>
						</div>
					}
				/>

				<div className="mb-4 grid gap-4 md:grid-cols-4">
					<AdminStatCard label="Pending" value={summary.pendingCount} />
					<AdminStatCard label="Settling" value={summary.settlingCount} />
					<AdminStatCard label="Completed" value={summary.completedCount} />
					<AdminStatCard label="Failed" value={summary.failedCount} />
				</div>

				<AdminDataTableShell
					title="Order Activity"
					description="Workflow lifecycle for every investor order, kept separate from the underlying money-movement ledger."
					filters={
						<AdminFilterBar>
							<div className="max-w-sm flex-1">
								<select
									value={status}
									onChange={(event) => setStatus(event.target.value)}
									className="min-h-[50px] w-full rounded-[14px] border theme-border theme-card px-4 py-3 theme-text"
								>
									<option value="">All statuses</option>
									{[
										'DRAFT',
										'PENDING_SIGNATURE',
										'SUBMITTED',
										'SETTLING',
										'COMPLETED',
										'FAILED',
										'CANCELLED',
									].map((value) => (
										<option key={value} value={value}>
											{value.replaceAll('_', ' ')}
										</option>
									))}
								</select>
							</div>
						</AdminFilterBar>
					}
					loading={loading}
					loadingLabel="Loading orders..."
					isEmpty={visibleOrders.length === 0}
					emptyTitle="No orders recorded yet"
					emptyDescription="Draft, submitted, settling, and completed investment orders will appear here after you begin the invest workflow."
				>
					<table className="min-w-full border-separate border-spacing-y-3">
						<thead>
							<tr className="text-left text-sm theme-text-secondary">
								{[
									'Date',
									'Project',
									'Order Type',
									'Amount',
									'Tokens',
									'Status',
									'Reference',
									'Last Updated',
									'Action',
								].map((heading) => (
									<th
										key={heading}
										className="pb-2 font-medium uppercase tracking-[0.08em]"
									>
										{heading}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{visibleOrders.map((order) => (
								<tr key={order.id} className="theme-card text-sm theme-text">
									<td className="rounded-l-[18px] px-4 py-4">
										{new Date(order.createdAt).toLocaleString()}
									</td>
									<td className="px-4 py-4 font-semibold">
										{order.projectName}
									</td>
									<td className="px-4 py-4">{order.orderType}</td>
									<td className="px-4 py-4 font-semibold">
										{money(order.currencyAmount)}
									</td>
									<td className="px-4 py-4">
										{formatTokenAmount(order.tokenAmount)}
									</td>
									<td className="px-4 py-4">
										<AdminStatusBadge
											label={order.status}
											tone={statusTone(order.status)}
										/>
									</td>
									<td className="px-4 py-4 theme-text-secondary">
										{order.reference || order.txHash || '—'}
									</td>
									<td className="px-4 py-4">
										{new Date(order.updatedAt).toLocaleString()}
									</td>
									<td className="rounded-r-[18px] px-4 py-4">
										<div className="flex flex-wrap gap-2">
											<button
												type="button"
												onClick={() => void openDetail(order.id)}
												className="rounded-[10px] border border-[#D9E2EF] px-3 py-2 text-[12px] font-semibold text-[#163F74]"
											>
												View details
											</button>
											{order.canRetry ? (
												<button
													type="button"
													onClick={() =>
														navigate(`/opportunities/${order.projectId}`)
													}
													className="rounded-[10px] border border-[#D9E2EF] px-3 py-2 text-[12px] font-semibold text-[#163F74]"
												>
													Retry
												</button>
											) : null}
											{order.canCancel ? (
												<button
													type="button"
													disabled={busyOrderId === order.id}
													onClick={() => void cancelOrder(order.id)}
													className="rounded-[10px] border border-[#F3D2D2] px-3 py-2 text-[12px] font-semibold text-[#B42318] disabled:opacity-60"
												>
													Cancel
												</button>
											) : null}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</AdminDataTableShell>
			</div>

			<OrderDetailModal
				order={selectedOrder}
				onClose={() => setSelectedOrder(null)}
				onOpenTransactions={(reference) =>
					navigate(
						reference
							? `/transactions?reference=${encodeURIComponent(reference)}`
							: '/transactions',
					)
				}
			/>
		</div>
	);
}
