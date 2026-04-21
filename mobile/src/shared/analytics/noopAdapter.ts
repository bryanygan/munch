import type { AnalyticsAdapter, AnalyticsEvent } from './types';

const DEV_LOGGING = __DEV__;

export const noopAdapter: AnalyticsAdapter = {
  identify(userId, traits) {
    if (DEV_LOGGING) console.log('[analytics] identify', userId, traits);
  },
  track(event: AnalyticsEvent) {
    if (DEV_LOGGING) console.log('[analytics]', event.name, event);
  },
  reset() {
    if (DEV_LOGGING) console.log('[analytics] reset');
  },
};
