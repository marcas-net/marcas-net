export function trackEvent(event: string, properties?: Record<string, string>) {
  // Google Analytics (gtag)
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const w = window as unknown as { gtag: (cmd: string, evt: string, params?: Record<string, string>) => void };
    w.gtag('event', event, properties);
  }

  // PostHog
  if (typeof window !== 'undefined' && 'posthog' in window) {
    const w = window as unknown as { posthog: { capture: (e: string, p?: Record<string, string>) => void } };
    w.posthog.capture(event, properties);
  }

  // Plausible
  if (typeof window !== 'undefined' && 'plausible' in window) {
    const w = window as unknown as { plausible: (e: string, opts?: { props: Record<string, string> }) => void };
    w.plausible(event, properties ? { props: properties } : undefined);
  }
}
