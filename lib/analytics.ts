/**
 * Google Analytics event tracking utilities
 *
 * Usage:
 *   import { trackEvent } from '@/lib/analytics';
 *   trackEvent('sign_up', { method: 'email' });
 *   trackEvent('purchase', { value: 299, currency: 'USD', item_name: 'Design Sprint' });
 */

type EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Track a custom event in Google Analytics
 * @param eventName - The name of the event (e.g., 'sign_up', 'purchase', 'form_submit')
 * @param params - Optional parameters to include with the event
 */
export function trackEvent(eventName: string, params?: EventParams): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('event', eventName, params);
}

// ============================================================================
// Pre-defined event helpers for common actions
// These use GA4's recommended event names where applicable
// See: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
// ============================================================================

/** Track when a user signs up */
export function trackSignUp(method?: string): void {
  trackEvent('sign_up', method ? { method } : undefined);
}

/** Track when a user logs in */
export function trackLogin(method?: string): void {
  trackEvent('login', method ? { method } : undefined);
}

/** Track form submissions */
export function trackFormSubmit(formName: string, params?: EventParams): void {
  trackEvent('form_submit', { form_name: formName, ...params });
}

/** Track when a user starts a checkout/purchase flow */
export function trackBeginCheckout(value?: number, currency = 'USD'): void {
  trackEvent('begin_checkout', { value, currency });
}

/** Track a completed purchase */
export function trackPurchase(
  transactionId: string,
  value: number,
  currency = 'USD',
  itemName?: string
): void {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    item_name: itemName,
  });
}

/** Track when a user views a specific item/page of interest */
export function trackViewItem(itemId: string, itemName: string, params?: EventParams): void {
  trackEvent('view_item', { item_id: itemId, item_name: itemName, ...params });
}

/** Track CTA button clicks */
export function trackCtaClick(ctaName: string, location?: string): void {
  trackEvent('cta_click', { cta_name: ctaName, location });
}

/** Track when a user creates a project */
export function trackProjectCreate(projectType?: string): void {
  trackEvent('project_create', projectType ? { project_type: projectType } : undefined);
}

/** Track errors for debugging */
export function trackError(errorMessage: string, errorLocation?: string): void {
  trackEvent('error', { error_message: errorMessage, error_location: errorLocation });
}
