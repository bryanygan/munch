export type ErrorContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id: string };
};

export interface ErrorAdapter {
  captureException(error: unknown, context?: ErrorContext): void;
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
  setUser(user: { id: string } | null): void;
  addBreadcrumb(crumb: { category: string; message: string; data?: Record<string, unknown> }): void;
}
