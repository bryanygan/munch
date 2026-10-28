import type { SwipeDirection } from '@/domain/session/mutations';

export type AnalyticsEvent =
  | { name: 'onboarding_started' }
  | { name: 'onboarding_completed'; allergen_count: number; diet: string | null; price_min: number; price_max: number }
  | { name: 'session_started'; session_id: string }
  | { name: 'swipe'; dish_id: string; direction: SwipeDirection; session_id: string; swipe_index: number }
  | { name: 'match_revealed'; session_id: string; top_match_percent: number; top_match_dish_id: string; likes_at_match: number; total_swipes_at_match: number }
  | { name: 'match_action'; action: 'keep_swiping' | 'start_over' | 'view_details' | 'share'; session_id: string }
  | { name: 'filters_changed'; allergens_added: string[]; allergens_removed: string[]; diet: string | null }
  | { name: 'data_reset'; scope: 'session' | 'history' | 'all' };

export interface AnalyticsAdapter {
  identify(userId: string, traits?: Record<string, unknown>): void;
  track(event: AnalyticsEvent): void;
  reset(): void;
}
