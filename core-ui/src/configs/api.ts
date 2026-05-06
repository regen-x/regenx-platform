const rawApiBase = import.meta.env.VITE_API_URL || '/api/v1';

export const API_BASE = rawApiBase.replace(/\/+$/, '');
