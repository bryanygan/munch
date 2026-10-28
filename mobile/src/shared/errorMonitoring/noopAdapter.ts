import type { ErrorAdapter } from './types';

const DEV_LOGGING = __DEV__;

export const noopErrorAdapter: ErrorAdapter = {
  captureException(error, context) {
    if (DEV_LOGGING) console.error('[error]', error, context);
  },
  captureMessage(message, level = 'info') {
    if (DEV_LOGGING) console.log(`[error:${level}]`, message);
  },
  setUser(user) {
    if (DEV_LOGGING) console.log('[error] setUser', user);
  },
  addBreadcrumb(crumb) {
    if (DEV_LOGGING) console.log('[error:breadcrumb]', crumb.category, crumb.message, crumb.data);
  },
};
