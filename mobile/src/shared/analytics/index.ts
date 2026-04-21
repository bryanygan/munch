import { noopAdapter } from './noopAdapter';
import type { AnalyticsAdapter, AnalyticsEvent } from './types';

let adapter: AnalyticsAdapter = noopAdapter;

export const setAnalyticsAdapter = (a: AnalyticsAdapter) => { adapter = a; };
export const analytics = {
  identify: (userId: string, traits?: Record<string, unknown>) => adapter.identify(userId, traits),
  track: (event: AnalyticsEvent) => adapter.track(event),
  reset: () => adapter.reset(),
};

export type { AnalyticsAdapter, AnalyticsEvent };
