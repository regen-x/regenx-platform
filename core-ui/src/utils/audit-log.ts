export type AuditEvent = {
	id: string;
	timestamp: string;
	actor: string;
	role: string;
	action: string;
	entityType: 'Project' | 'Investor' | 'Transaction' | 'System';
	entityName: string;
	details: string;
};

export const AUDIT_LOG_KEY = 'regenx_audit_log';

export const getAuditEvents = (): AuditEvent[] => {
	try {
		const raw = localStorage.getItem(AUDIT_LOG_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch (error) {
		console.error('Failed to read audit log', error);
		return [];
	}
};

export const saveAuditEvents = (events: AuditEvent[]) => {
	localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(events));
};

export const logAuditEvent = (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
	const existing = getAuditEvents();

	const next: AuditEvent = {
		id: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		...event,
	};

	saveAuditEvents([next, ...existing]);
};
