export interface AppErrorResponse {
  error: AppError;
}

interface AppError {
  status: string;
  source: { pointer: string };
  title: string;
  detail: string;
}
