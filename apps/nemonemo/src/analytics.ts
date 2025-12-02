type GtagArgs = [string, ...unknown[]];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

export function initAnalytics(measurementId?: string) {
  if (!measurementId || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (window.gtag) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  const dataLayer = (window.dataLayer = window.dataLayer ?? []);
  const gtag = (...args: GtagArgs) => {
    dataLayer.push(args);
  };

  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId);
}
