import { noopErrorAdapter } from './noopAdapter';
import type { ErrorAdapter, ErrorContext } from './types';

let adapter: ErrorAdapter = noopErrorAdapter;

export const setErrorAdapter = (a: ErrorAdapter) => { adapter = a; };
export const errorMonitoring = {
  captureException: (error: unknown, context?: ErrorContext) => adapter.captureException(error, context),
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => adapter.captureMessage(message, level),
  setUser: (user: { id: string } | null) => adapter.setUser(user),
  addBreadcrumb: (crumb: Parameters<ErrorAdapter['addBreadcrumb']>[0]) => adapter.addBreadcrumb(crumb),
};

export type { ErrorAdapter, ErrorContext };
